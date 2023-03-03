// renderer 渲染进程共用的工具类 方法 代码块

const {ipcRenderer} = require("electron");

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

/**
 * 处理键盘事件 P 按键
 * 按p键 是拍照 并且提示保存照片
 *
 * @param el 拖拽的element对象 这两种写法均可获得【var video1 = document.getElementById("填入元素的id")】【var video2 = document.querySelector('video')】
 */
async function dealFuncP(el) {
    const this_imageData = getImgFromVedio(el);
    const is_ok = await ipcRenderer.invoke('controller.example.savePicture', {name: 'win-camera', imageData:this_imageData});
}

/**
 * 处理鼠标事件 Q 按键
 * 按q键 退出窗口
 *
 * @param this_win_name 窗口名称
 */
async function dealFuncQ(this_win_name) {
    const is_ok = await ipcRenderer.invoke('controller.example.removeWCid', this_win_name);
}

/**
 * 拍照功能从视频流画出照片
 *
 * @param el 拖拽的element对象 这两种写法均可获得【var video1 = document.getElementById("填入元素的id")】【var video2 = document.querySelector('video')】
 * @returns {string}
 */
function getImgFromVedio(el) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    // 将图片数据保存
    const imageData = canvas.toDataURL("image/png");
    // console.log(canvas.toDataURL("image/png"));
    return imageData
}

/**
 * 处理键盘事件 c 按键
 * 按c键 是保存录制的录像 目前此方法只是系统窗口提示
 *
 * @param el 未使用 | 拖拽的element对象 这两种写法均可获得【var video1 = document.getElementById("填入元素的id")】【var video2 = document.querySelector('video')】
 * @param recorder 录制器
 */
function dealFuncC(el, recorder) {
    if (recorder == null) {
        ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '警告', body: '你没有可以打开的摄像头 拒绝保存录像' })
        return
    }
    // 停止录制并保存录像
    ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '消息', body: '停止录制并保存录像'})
}

// 导出
exports.drag_plus = drag_plus
exports.sayHi = sayHiFuc
exports.dealFuncP = dealFuncP
exports.dealFuncQ = dealFuncQ
exports.dealFuncC = dealFuncC
