import { Hash, IDocDataStore, IPath, Handle } from './interfaces';
import { query2obj, obj2query } from './url';
import extend from 'lodash-ts/extend';
import isArray from 'lodash-ts/isArray';
import isString from 'lodash-ts/isString';
import isObject from 'lodash-ts/isObject';

/**
* @module @feidao/core/lang
* @example
* import {uuid} from '@feidao/core/lang';
* let id = uuid();
*/

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

export function get_table_field(p_field: string) {
	let obj = {
		field: '',
		table: ''
	};
	if (p_field) {
		p_field = p_field.replace(/\.dataArray/g, '');
		if (/^(\w+\.)+\[\w+\:\w+\]\.\w+$/.test(p_field)) {
			// 窄表	table1.dataArray.table2.[key_field:key].value_field
			let tmp = p_field.match(/[^\[|\.|\]]+/g);
			tmp.pop(); // 1.field target_val
			let key = tmp.pop(); // 2.key	key_field:key
			obj.field = key.split(':')[1];
			obj.table = tmp.join('.'); // 3.path table
		}
		else {
			// 宽表	// table1.dataArray.table2.dataArray.field
			let tmp = p_field.match(/[^\[|\.|\]]+/g);
			obj.field = tmp.pop(); // 1.field
			obj.table = tmp.join('.'); // 2.path without dataArray
		}
	}
	return obj;
	//			let obj = {};
	//			if (/^(\w+\.dataArray\.)+(\w+)+$/.test(p_field)) {
	//				// 宽表	// table.dataArray.field
	//				let tmp = p_field.match(/[^\[|\.|\]]+/g);
	//				obj.field = tmp.pop(); // 1.field
	//				obj.table = tmp.join('.').replace(/\.dataArray/g, ''); // 2.path without dataArray
	//			}else if ( /^(\w+\.)+\[\w+\:\w+\]\.\w+$/.test(p_field)) {
	//				let n_field = p_field.replace(/\.dataArray/g, '');
	//				// 窄表	table.[key_field:key].value_field
	//				let tmp = n_field.match(/[^\[|\.|\]]+/g);
	//				obj.field = tmp.pop(); // 1.field
	//				obj.key = tmp.pop(); // 2.key	key_field:key
	//				obj.table = tmp.join('.').replace(/\.dataArray/g, ''); // 3.path table
	//			}
	//			return obj;
}

// export function get_field(p_field: string, p_path: string) {
// 	let obj = get_table_field(p_field);
// 	if (obj.table !== p_path.replace(/\.dataArray/g, '')) {
// 		return null;
// 	}
// 	return obj.key ? obj.key.split(':')[1] : obj.field;
// }

/**
 * ## 将path转为字符串
 * @param  {array} p_path   path数组 [table1,{key:'_id', value:'xxxx'}table2]
 * @param  {boolean} p_ignore 是否忽略dataArray
 * @return {string}          table1.dataArray.table2 or table1.table2
 */
export function path2str(p_path: IPath, p_ignore?: boolean) {
	return (p_path || []).filter(function (item, i) {
		return i % 2 === 0;
	}).join(p_ignore ? '.' : '.dataArray.');
}

/**
 * ## 获取数据
 * @param  {object} p_data 完整数据块
 * @param  {array} p_path 数据路径
 * @return {(object|array)}        数据
 */
export function get_data_by_path(p_data: IDocDataStore, p_path: any[]) {
	if (!p_path || p_path.length === 0) {
		return null;
	}
	if (p_data) {
		// console.debug('get_data_by_path:begin:', locale.format(new Date(), {
		// 	selector: 'time',
		// 	timePattern: 'a HH:mm:ss.SSS'
		// }));
		let data: any = p_data;
		for (let i = 0; i < p_path.length; i++) {
			if (i % 2 === 0) {
				if (!data[p_path[i]]) {
					data[p_path[i]] = { dataArray: [] };
				}
				data = data[p_path[i]];
			}
			else if (i % 2 === 1) {
				data = data.dataArray;
				let key_val = p_path[i];
				let fields = Object.keys(key_val);
				if (!data.some(function (p_item: Object) {
					if (fields.every(function (field) {
						return equals(key_val[field], p_item[field]);
					})) {
						data = p_item;
						return true;
					} else {
						return false;
					}
				})) {
					console.debug('未查找到数据');
					return {};
				}
			}
		}
		return data;
	}
	else {
		console.info("数据不存在！");
		console.log(p_data, p_path);
	}
}

/**
 * ## 判断两个对象是否相等
 * @param  {(object|array|string)} p_o1
 * @param  {(object|array|string)} p_o2
 * @function
 * @access public
 * @return {boolean}
 * @example
 * let a = ['a', 'b'];
 * let b = ['b', 'a'];
 * lang.equals(a, b);	// false
 * @example
 * let a = ['a', 'b'];
 * let b = ['a', 'b'];
 * lang.equals(a, b);	// true
 * @example
 * let c = {x:1,y:'zero'};
 * let d = {x:1,y:'zero'};
 * lang.equals(c, d);	// true
 */
export function equals(p_o1: any, p_o2: any) {
	// both are undefined
	if (p_o1 === undefined && p_o2 === undefined) {
		return true;
	}
	// both are null
	if (p_o1 === null && p_o2 === null) {
		return true;
	}
	// one of them is null or undefined, while the other is not
	if (p_o1 === undefined || p_o1 === null || p_o2 === undefined || p_o2 === null) {
		return false;
	}
	// both are arrays
	if (isArray(p_o1) && isArray(p_o2)) {
		if (p_o1.length !== p_o2.length) {
			return false;
		}
		for (let i = p_o1.length; i--;) {
			if (!equals(p_o1[i], p_o2[i])) {
				return false;
			}
		}
		return true;
	}
	// both are strings
	if (isString(p_o1) && isString(p_o2)) {
		return p_o1 === p_o2;
	}
	// both are objects
	if (isObject(p_o1) && isObject(p_o2)) {
		let o = extend({}, p_o1, p_o2);
		for (let key in o) {
			if ((p_o1.hasOwnProperty(key) && !p_o2.hasOwnProperty(key)) || (!p_o1.hasOwnProperty(key) && p_o2.hasOwnProperty(key))) {
				return false;
			}
			else if (p_o1.hasOwnProperty(key) && p_o2.hasOwnProperty(key) && !equals(p_o1[key], p_o2[key])) {
				return false;
			}
		}
		return true;
	}
	// todo: when p_o1 and p_o2 are functions
	return p_o1 === p_o2;
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
 * ## 窄表转宽表
 *
 * @export
 * @param {any[]} p_data			窄表数据
 * @param {(string | string[])}		p_keys 关键字,字符串数组
 * @param {string} p_key_field		“字段名称”字段
 * @param {string} [p_val_field]	“字段值”字段
 * @returns {any}
 * @example
 * let data =[{
	"target": "store_price",
	"target_value": 100.25,
	"group_no": 0,
	"dept_no" : 2
}{
	"target": "store_price",
	"target_value": 100.25,
	"group_no": 1,
	"dept_no" : 3
}];
 * data = lang.n2w(data, ['group_no', 'dept_no'], 'target', 'target_val');
 * @example
 * let data =[{
	"target": "other_money",
	"target_value": "0.00"
}{
	"target": "unit_price",
	"target_value": "2000.00"
}];
* data = lang.n2w(data, 'target', 'target_val');
*/
export function n2w(p_data: any[], p_keys: string | string[], p_key_field: string, p_val_field?: string) {
	if (!p_val_field) {
		p_val_field = p_key_field;
		p_key_field = <string>p_keys;
		p_keys = null;
	}
	if (p_keys) {
		let data = <any[]>[];
		if (isString(p_keys)) {
			p_keys = <string[]>[p_keys];
		}
		p_data = p_data.sort(function (r1, r2) {
			for (let i = 0; i < p_keys.length; ++i) {
				let key = p_keys[i];
				if (r1[key] !== r2[key]) {
					return (r1[key] > r2[key] ? 1 : -1);
				}
			}
			return 0;
		});
		let __create_row = function (p_row: any, p_keys: any) {
			let row = {};
			for (let i = p_keys.length; i--;) {
				let key = p_keys[i];
				row[key] = p_row[key];
			}
			return row;
		};
		let keys = {};
		for (let i = 0; i < p_keys.length; ++i) {
			keys[p_keys[i]] = null;
		}
		let row: any;
		for (let i = 0; i < p_data.length; ++i) {
			let d = p_data[i];
			if (row) {
				let flag = true;
				for (let j = 0; j < p_keys.length; ++j) {
					let key = p_keys[j];
					let key1 = keys[key];
					let key2 = d[key];
					if (key1 !== key2) {
						flag = false;
						break;
					}
				}
				if (!flag) {
					row = __create_row(d, p_keys);
					data.push(row);
					for (let k = 0; k < p_keys.length; ++k) {
						let key = p_keys[k];
						keys[key] = row[key];
					}
				}
			}
			else {
				row = __create_row(d, p_keys);
				data.push(row);
				for (let k = 0; k < p_keys.length; ++k) {
					let key = p_keys[k];
					keys[key] = row[key];
				}
			}
			row[d[p_key_field]] = d[p_val_field];
		}
		return data;
	}
	else {
		let row = {};
		for (let i = 0; i < p_data.length; ++i) {
			let _d = p_data[i];
			row[_d[p_key_field]] = _d[p_val_field];
		}
		return row;
	}
}


/**
* 设置URL参数
* @param p_name 参数名称
* @param p_value 参数值
* @param p_do_not_refresh 是否不刷新页面,默认刷新
* @param p_page_url 页面地址
*/
export function set_url_param(p_name: string, p_value: string | number | boolean, p_do_not_refresh: boolean, p_page_url: string, location = window.location) {
	let pathname = location.pathname;
	let search = location.search.substr(1);
	let query = query2obj(search);
	if (p_value) {
		query[p_name] = p_value;
	}
	else {
		delete query[p_name];
	}
	let url = (p_page_url || pathname) + '?' + obj2query(query);
	if (!p_do_not_refresh) {
		location.href = url;
	}
	return url;
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
