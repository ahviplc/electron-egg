// renderer 渲染进程共用的工具类 方法 代码块

/**
 * 拖拽方法 适配双平台
 *
 * @param el 拖拽的element对象 这两种写法均可获得【var video1 = document.getElementById("填入元素的id")】【var video2 = document.querySelector('video')】
 * @param window_name 窗口名称
 */
let drag_plus = function (el, window_name) {
    // Electron 无边框窗口的拖动
// 借鉴的解决代码【https://www.jianshu.com/p/96327b044e85】
// 通过响应页面的 mousemove 事件
    let dragging = false;
    let mouseX = 0;
    let mouseY = 0;
    let this_x = 0; // 偏移量x
    let this_y = 0; // 偏移量y
    el.addEventListener('mousedown', (e) => {
        dragging = true;
        const {pageX, pageY} = e;
        mouseX = pageX;
        mouseY = pageY;
    });
    window.addEventListener('mouseup', () => {
        dragging = false;
    });
    window.addEventListener('mousemove', (e) => {
        if (dragging) {
            const {pageX, pageY} = e;
            this_x = pageX - mouseX;
            this_y = pageY - mouseY;
            // 改变此弹出窗口的样式 高 宽 是否透明等
            ipcRenderer.invoke('controller.example.makeItDraggable', {
                name: window_name, //【win-camera】可在【frontend/src/views/base/window/Index.vue:57】进行配置 默认如果不配置就是【window-1】是【electron/controller/example.js.createWindow (args)】写死的name
                this_x: this_x,
                this_y: this_y
            }).then(res => {
                console.log('res:', res)
            })
        }
    });
};

/**
 * sayHi 示例方法
 *
 * @returns {string}
 */
let sayHiFuc = function () {
    console.log('sayHi')
    return 'sayHiO'
};

// 导出
exports.drag_plus = drag_plus
exports.sayHi = sayHiFuc
