// 页面返回事件的回调监听

// document.addEventListener('backbutton', function (e) {
// 	// 在这里处理你的业务逻辑
// 	e.preventDefault(); //backbutton事件的默认行为是回退历史记录，如果你想阻止默认的回退行为，那么可以通过preventDefault()实现
// });
// 此事件也不支持在OA自定义首页使用

// Note：iOS不支持这个事件，iOS的返回事件请使用setLeft JsApi

// 页面resume事件的回调监听

// 当页面重新可见并可以交互的时候，钉钉会给出一个回调，开发者可以监听这个resume事件，处理自己的业务逻辑。
// document.addEventListener('resume', function () {
// 	// 在这里处理你的业务逻辑
// });
// 页面pause事件的回调监听

// 当页面不可见的时候，钉钉会给出一个回调，开发者可以监听这个pause事件，处理自己的业务逻辑。
// 示例代码如下：
// document.addEventListener('pause', function () {
// 	// 在这里处理你的业务逻辑
// });
// 页面标题双击事件的回调监听

// 当页面标题被双击的时候，钉钉会给出一个回调，开发者可以监听这个双击回调事件，处理自己的业务逻辑。
// 示例代码如下：
// document.addEventListener('navTitle', function () {
// 	// 在这里处理你的业务逻辑
// });
