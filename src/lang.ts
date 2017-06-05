// import { Hash, IDocDataStore, IPath, Handle } from './interfaces';
import extend from 'lodash-ts/extend';
import isArray from 'lodash-ts/isArray';
import isString from 'lodash-ts/isString';
import isObject from 'lodash-ts/isObject';
import { Handle } from './on';

/**
 * ## 生成一个唯一标识ID
 * @param  {number} [len=36]   长度
 * @param  {number} [salt=62] 随机数
 * @return {string}       生成唯一标识ID
 */
export function uuid(len?: number, salt?: number): string {
	const CHARS = '0123456789abcdef'.split('');
	let chars = CHARS;
	let uuid = <string[]>[];
	let rnd = Math.random;
	salt = salt || new Date().getTime();
	if (len) {
		for (let i = 0; i < len; i++) {
			uuid[i] = chars[0 | rnd() * salt];
		}
	}
	else {
		uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
		uuid[14] = '4';
		for (let i = 0; i < 36; i++) {
			if (!uuid[i]) {
				let r = 0 | rnd() * 16;
				uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r & 0xf];
			}
		}
	}
	return uuid.join('');// .replace(/-/g, '');
}

/**
 * ## 按字节长度截取字符串
 * @param  {string} p_str            原始字符串
 * @param  {int} p_limit_byte_len 要截取字符串的字节长度
 * @return {string}                  截取的字符串
 * @example
 * console.info(lang.trim_right("飞道科技", 7));
 * console.info(lang.trim_right("飞道科技", 8));
 */
export function trim_right(p_str: string, p_limit_byte_len: number) {
	let len = get_str_byte_length(p_str);
	if (len > p_limit_byte_len) {
		let i = 0;
		for (let l = 0; i < p_str.length; ++i) {
			let c = p_str.charCodeAt(i);
			if ((c >= 0x0001 && c <= 0x007e || 0xff60 <= c && c <= 0xff9f)) {
				// 单字节
				++l;
			}
			else {
				// 双字节
				l += 2;
			}
			if (l > p_limit_byte_len) {
				break;
			}
		}
		p_str = p_str.substr(0, i);
	}
	return p_str;
}

/**
 * ## 获取字符串的字节长度，一个汉字为两个字节
 * @param  {string} p_str 字符串
 * @return {number}       字节长度
 * @example
 * console.info(lang.get_str_byte_length("飞道科技"));	// 8
 * console.info(lang.get_str_byte_length("feidao"));	// 6
 */
export function get_str_byte_length(p_str: string) {
	if (!p_str) {
		return 0;
	}
	return p_str.replace(/[^\x00-\xff]/g, "mm").length;
}

/**
 * ## 获取webroot
 * @function
 * @access public
 * @return {string} 当前站点的根目录地址,like http:// yourwebsite/
 */
export function get_root_path() {
	let pathName = window.location.pathname.substring(1);
	let webName = pathName === '' ? '' : pathName.substring(0, pathName.indexOf('/'));
	return window.location.protocol + '// ' + window.location.host + '/' + webName + '/';
}

/**
 * Returns an object with a destroy method that, when called, calls the passed-in destructor.
 * This is intended to provide a unified interface for creating "remove" / "destroy" handlers for
 * event listeners, timers, etc.
 *
 * @param destructor A function that will be called when the handle's `destroy` method is invoked
 * @return The handle object
 */
export function createHandle(destructor: () => void): Handle {
	return {
		destroy: function () {
			this.destroy = function () { };
			destructor.call(this);
		}
	};
}

/**
 * Returns a single handle that can be used to destroy multiple handles simultaneously.
 *
 * @param handles An array of handles with `destroy` methods
 * @return The handle object
 */
export function createCompositeHandle(...handles: Handle[]): Handle {
	return createHandle(function () {
		for (let handle of handles) {
			handle.destroy();
		}
	});
}
