// renderer.js 渲染进程
// for vedio_window.html

const {ipcRenderer} = require('electron');
const path = require('path');
// 获得video摄像头区域
var video = document.getElementById("video");
var videoStream = null;
// 因为摄像头视频流是自动播放的 所以将stop标签默认为false 使其第一次右键点击 其行为是暂停行为
var stop = false;
// 页面加载完成自动执行
window.onload = () => {
    // 获取摄像头视频流
    getMedia();

    // 一些知识点
    // 可在渲染进程中使用electron的api
    // 使用node的api

    // 使用node模板path打印文件绝对路径
    //【C:\_developSoftKu\ideaIU-2019.1.3.win\CodeKu2\electron-egg\public\html\vedio_window.html】
    // console.log(path.resolve(__dirname, 'vedio_window.html'));

    // 说明 window 这是前端中的 window
    // console.log(window)
    // 说明 ipcRenderer 这是用于从渲染器进程到主进程的异步通信的一个 EventEmitter 的实例
    // console.log(ipcRenderer)
    // invoke返回的promise ，then里可以拿到handle返回的结果
    // send 只是 发送事件 通过 event.reply （只有主进程的event有）可以回复这次通信的另一方

    // 下面写法可用
    // ipcRenderer.invoke('controller.example.test', {this_param:123}).then(res => {
    //     console.log('res:', res)
    // })

    // 提示音
    // 创建系统通知
    // const return_msg = {
    //     type: 'main',
    //     title: '提示音',
    //     subtitle: '副标题-提示音',
    //     body: '这是通知内容-我是测试-提示音',
    //     silent: false, /*控制有无通知音-为false代表有 true代表无*/
    // }
    // 可用的
    // ipcRenderer.send('controller.example.sendNotification', return_msg)

    // 只传标题和内容
    // 可用
    // ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title:'test',body:'test内容'})

    // 异步操作
    // 延时加载一下 主要是将里面的方法代码异步执行
    // node_modules/ee-core/addon/window/index.js:34 | 要不窗口内容的监听器 did-finish-load 代码还没有执行 往map注册窗口name和id 在line35行代码
    // 执行之后 才会存入【windowContentsIdMap 保存窗口webContents.id 的对象】【electron-egg文档 addon https://www.yuque.com/u34495/mivcfg/yli9m1zb0xhusb1x】
    // 才不会导致运行【electron/controller/example.js._getBrowserWindow()】时 此页面的id获取为null 导致报错
    // 创建延时器
    let timer = setTimeout(function () {
        console.log("再次初始化样式", "modifyBrowserWindowStyle");
        // 改变此弹出窗口的样式 高 宽 是否透明等
        ipcRenderer.invoke('controller.example.modifyBrowserWindowStyle', {
            name: 'win-camera', //【win-camera】可在【frontend/src/views/base/window/Index.vue:57】进行配置 默认如果不配置就是【window-1】是【electron/controller/example.js.createWindow (args)】写死的name
            height: 250,
            width: 250
        }).then(res => {
            console.log('res:', res)
        })
    }, 50);
    // 清除延时器
    // clearTimeout(timer);

};

// 目前此页面感觉不需要 因为摄像头前端的页面样式 就是已经是最小范围了 直接设置为 false 使其无法穿透窗口就行了
// 点击穿透窗口 转发
// setIgnoreMouseEvents(true/false) 设置为 false 点击将无法穿透窗口 设置为 true 点击可穿透窗口
// 对应官方文档【https://www.electronjs.org/zh/docs/latest/api/frameless-window#转发】

// 监听鼠标进入
video.addEventListener('mouseenter', () => {
    console.log(' === public/html/vedio_window.html', ' mouseenter ===')
})

// 监听鼠标出去
video.addEventListener('mouseleave', () => {
    console.log('=== public/html/vedio_window.html', ' mouseleave ===')
})

// Electron 无边框窗口的拖动
// 借鉴的解决代码【https://www.jianshu.com/p/96327b044e85】
// 通过响应页面的 mousemove 事件
let dragging = false;
let mouseX = 0;
let mouseY = 0;
let this_x = 0; // 偏移量x
let this_y = 0; // 偏移量y
video.addEventListener('mousedown', (e) => {
    dragging = true;
    const { pageX, pageY } = e;
    mouseX = pageX;
    mouseY = pageY;
});
window.addEventListener('mouseup', () => {
    dragging = false;
});
window.addEventListener('mousemove', (e) => {
    if (dragging) {
        const { pageX, pageY } = e;
        this_x = pageX - mouseX;
        this_y = pageY - mouseY;
        // 改变此弹出窗口的样式 高 宽 是否透明等
        ipcRenderer.invoke('controller.example.makeItDraggable', {
            name: 'win-camera', //【win-camera】可在【frontend/src/views/base/window/Index.vue:57】进行配置 默认如果不配置就是【window-1】是【electron/controller/example.js.createWindow (args)】写死的name
            this_x:  this_x,
            this_y:  this_y
        }).then(res => {
            console.log('res:', res)
        })
    }
});

// 双击停止视频并且关闭摄像头
video.ondblclick = () => {
    // 发送关闭摄像头通知-让主线程发送系统通知
    // window.dialogAPI.quitVedio("退出直播");
    ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '通知', body: '退出直播'})
    // this.stopMedia();
    // window.opener.postMessage("close-vedio-window");
    close_win()
};

async function close_win() {
    // 获取主窗口id
    ipcRenderer.invoke('controller.example.getWCid', 'main').then(id => {
        const this_mainWCid = id;
        console.log('主窗口的id', this_mainWCid)
        // 此窗口和主窗口通信 可用
        // ipcRenderer.sendTo(this_mainWCid, 'window2-to-window1', '窗口2 通过 sendTo 给主窗口发送消息');
    });

    // 调用官方api 关闭窗口
    const is_ok = await ipcRenderer.invoke('controller.example.removeWCid', 'win-camera');
    // 此处可以正常获取 只不过当时此窗口已被关闭 无任何效果罢了
    // console.log(is_ok)
    // if(is_ok){
    //     ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '通知', body: '关闭窗口成功'})
    // }
}

// 右键是暂停和开始摄像
video.oncontextmenu = () => {
    if (stop) {
        // window.dialogAPI.resumeVedio("继续直播");
        ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '通知', body: '继续直播'})
        this.reStartMedia();
    } else {
        // window.dialogAPI.pauseVedio("暂停直播");
        ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '通知', body: '暂停直播'})
        this.fakeStopMedia();
    }
};

// 重新播放
function reStartMedia() {
    video.play();
    this.stop = false;
}

// 假暂停-后台继续还有视频流
function fakeStopMedia() {
    video.pause();
    this.stop = true;
}

// 结束获取视频流数据
function stopMedia() {
    this.videoStream.getTracks()[0].stop();
    this.videoStream.getTracks()[1].stop();
}

// 获得视频流数据
function getMedia() {
    var constraints = {
        video: {width: 160, height: 160},
        audio: true,
    };
    //   H5新媒体接口 navigator.mediaDevices.getUserMedia()
    var promise = navigator.mediaDevices.getUserMedia(constraints);
    promise
        .then(function (MediaStream) {
            video.srcObject = MediaStream;
            video.play();
            this.videoStream = MediaStream;
            this.stop = false;
        })
        .catch(function (PermissionDeniedError) {
            // console.log(PermissionDeniedError);
            console.log('Error => ', PermissionDeniedError.name, PermissionDeniedError.message, " 未发现设备");
            var return_msg = 'Error => ' + PermissionDeniedError.name + PermissionDeniedError.message + " 未发现设备";
            // alert(return_msg)
            ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title:'通知',body:return_msg})
        });
}
