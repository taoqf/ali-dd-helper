import on from "./on";
import { EventCallback } from './on';

// 页面返回事件的回调监听
// 此事件也不支持在OA自定义首页使用
// Note：iOS不支持这个事件，iOS的返回事件请使用setLeft JsApi
export function on_back_button(callback: EventCallback) {
	return on(document, 'backbutton', callback);
}

// 页面resume事件的回调监听
// 当页面重新可见并可以交互的时候，钉钉会给出一个回调，开发者可以监听这个resume事件，处理自己的业务逻辑。
export function on_resume(callback: EventCallback){
	return on(document, 'resume', callback);
}

// 当页面不可见的时候，钉钉会给出一个回调，开发者可以监听这个pause事件，处理自己的业务逻辑。
export function on_pause(callback: EventCallback){
	return on(document, 'pause', callback);
}

// 页面标题双击事件的回调监听
// 当页面标题被双击的时候，钉钉会给出一个回调，开发者可以监听这个双击回调事件，处理自己的业务逻辑。
export function on_nav_title(callback: EventCallback){
	return on(document, 'navTitle', callback);
}
