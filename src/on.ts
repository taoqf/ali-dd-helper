import { createHandle, createCompositeHandle } from './lang';
import { EventObject, Handle, EventEmitter, EventCallback } from './interfaces';

interface DOMEventObject extends EventObject {
	bubbles: boolean;
	cancelable: boolean;
}

export class Evented {
	/**
	 * Emits an event, firing listeners registered for it.
	 * @param event The event object to emit
	 */
	emit<T extends EventObject>(data: T): void {
		const type = '__on' + data.type;
		const method: Function = (<any>this)[type];
		if (method) {
			method.call(this, data);
		}
	}

	/**
	 * Listens for an event, calling the listener whenever the event fires.
	 * @param type Event type to listen for
	 * @param listener Callback to handle the event when it fires
	 * @return A handle which will remove the listener when destroy is called
	 */
	on(type: string, listener: (event: EventObject) => void): Handle {
		const name = '__on' + type;
		if (!(<any>this)[name]) {
			// define a non-enumerable property (see #77)
			Object.defineProperty(this, name, {
				configurable: true,
				value: undefined,
				writable: true
			});
		}
		return on(this, name, listener);
	}
}

/**
 * Provides a normalized mechanism for dispatching events for event emitters, Evented objects, or DOM nodes.
 * @param target The target to emit the event from
 * @param event The event object to emit
 * @return Boolean indicating if preventDefault was called on the event object (only relevant for DOM events;
 *     always false for other event emitters)
 */
export function emit<T extends EventObject>(target: Evented | EventTarget | EventEmitter, event: T | EventObject): boolean;
export function emit<T extends EventObject>(target: any, event: T | EventObject): boolean {
	if (
		target.dispatchEvent && /* includes window and document */
		((target.ownerDocument && target.ownerDocument.createEvent) || /* matches nodes */
			(target.document && target.document.createEvent) || /* matches window */
			target.createEvent) /* matches document */
	) {
		const nativeEvent = (target.ownerDocument || target.document || target).createEvent('HTMLEvents');
		nativeEvent.initEvent(
			event.type,
			Boolean((<DOMEventObject>event).bubbles),
			Boolean((<DOMEventObject>event).cancelable)
		);

		for (let key in event) {
			if (!(key in nativeEvent)) {
				nativeEvent[key] = (<any>event)[key];
			}
		}

		return target.dispatchEvent(nativeEvent);
	} else if (target.document && target.document.createEventObject) {
		// IE8 兼容性代码
		return fire_event_ie8(target, event);
	}

	if (target.emit) {
		if (target.removeListener) {
			// Node.js EventEmitter
			target.emit(event.type, event);
			return false;
		}
		else if (target.on) {
			target.emit(event);
			return false;
		}
	}

	throw new Error('Target must be an event emitter');
}

/**
 * Provides a normalized mechanism for listening to events from event emitters, Evented objects, or DOM nodes.
 * @param target Target to listen for event on
 * @param type Event event type(s) to listen for; may a string or an array of strings
 * @param listener Callback to handle the event when it fires
 * @param capture Whether the listener should be registered in the capture phase (DOM events only)
 * @return A handle which will remove the listener when destroy is called
 */
export default function on(target: EventTarget, type: string | string[], listener: EventCallback, capture?: boolean): Handle;
export default function on(target: EventEmitter | Evented, type: string | string[], listener: EventCallback): Handle;
export default function on(target: any, type: any, listener: any, capture?: boolean): Handle {
	if (Array.isArray(type)) {
		let handles: Handle[] = type.map(function (type: string): Handle {
			return on(target, type, listener, capture);
		});

		return createCompositeHandle(...handles);
	}

	// 监听函数加一层壳，使得函数唯一，用于移除事件监听
	const callback = function (...args: any[]) {
		listener(...args);
	};

	// DOM EventTarget
	if (target.addEventListener && target.removeEventListener) {
		target.addEventListener(type, callback, capture);
		return createHandle(function () {
			target.removeEventListener(type, callback, capture);
		});
	} else if (target.attachEvent && target.detachEvent) {
		// IE8 兼容性代码
		return bind_event_ie8(target, type, callback, capture);
	}

	if (target.on) {
		// EventEmitter
		if (target.removeListener) {
			target.on(type, callback);
			return createHandle(function () {
				target.removeListener(type, callback);
			});
		}
		// Evented
		else if (target.emit) {
			return target.on(type, listener);
		}
	}

	throw new TypeError('Unknown event emitter object');
}

function bind_event_ie8(target: any, type: string, callback: (...args: any[]) => any, capture?: boolean): Handle {
	if (target.attachEvent && target['on' + type] === null) {
		// browser support events
		target.attachEvent('on' + type, callback, capture);
		return createHandle(function () {
			target.detachEvent('on' + type, callback, capture);
		});
	} else {
		// custom events
		target[type] || (target[type] = []);
		target[type].push(callback);
		return createHandle(function () {
			let events = target[type] as ((...args: any[]) => any)[];
			events.some((evt, idx) => {
				if (evt === callback) {
					events.splice(idx, 1);
					return true;
				} else {
					return false;
				}
			});
		});
	}
}

function fire_event_ie8(target: any, event: EventObject): boolean {
	let evt = (<any>document).createEventObject();
	let e_type = 'on' + event.type;
	if (target.fireEvent && target[e_type] === null) {
		return target.fireEvent(e_type, evt);
	} else if (target[event.type]) {
		let events = target[event.type].filter(() => {
			return true;
		});
		events.forEach((fun: Function) => {
			fun(event);
		});
		return true;
	}
}
/**
 * Provides a mechanism for listening to the next occurrence of an event from event
 * emitters, Evented objects, or DOM nodes.
 * @param target Target to listen for event on
 * @param type Event event type(s) to listen for; may be a string or an array of strings
 * @param listener Callback to handle the event when it fires
 * @param capture Whether the listener should be registered in the capture phase (DOM events only)
 * @return A handle which will remove the listener when destroy is called
 */
export function once(target: EventTarget, type: string | string[], listener: EventCallback, capture?: boolean): Handle;
export function once(target: EventEmitter | Evented, type: string | string[], listener: EventCallback): Handle;
export function once(target: any, type: any, listener: any, capture?: boolean): Handle {
	const handle = on(target, type, function (...args: any[]) {
		handle.destroy();
		return listener(...args);
	}, capture);

	return handle;
}

export interface PausableHandle extends Handle {
	pause(): void;
	resume(): void;
}

/**
 * Provides a mechanism for creating pausable listeners for events from event emitters, Evented objects, or DOM nodes.
 * @param target Target to listen for event on
 * @param type Event event type(s) to listen for; may a string or an array of strings
 * @param listener Callback to handle the event when it fires
 * @param capture Whether the listener should be registered in the capture phase (DOM events only)
 * @return A handle with additional pause and resume methods; the listener will never fire when paused
 */
export function pausable(target: EventTarget, type: string | string[], listener: EventCallback, capture?: boolean): PausableHandle;
export function pausable(target: EventEmitter | Evented, type: string | string[], listener: EventCallback): PausableHandle;
export function pausable(target: any, type: any, listener: any, capture?: boolean): PausableHandle {
	let paused: boolean;

	const handle = <PausableHandle>on(target, type, function (...args: any[]) {
		if (!paused) {
			return listener(...args);
		}
	}, capture);

	handle.pause = function () {
		paused = true;
	};

	handle.resume = function () {
		paused = false;
	};

	return handle;
}
