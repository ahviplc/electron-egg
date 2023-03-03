// renderer.js 渲染进程
// for record_window.html
// this === window | 就是常规html下的窗口对象

const {ipcRenderer} = require('electron');
const path = require('path');
// 获得video摄像头区域
// 这样写也可以 【var video = document.querySelector('video')】
var video = document.getElementById("video");
var videoStream = null;
// 因为摄像头视频流是自动播放的 所以将stop标签默认为false 使其第一次右键点击 其行为是暂停行为
var stop = false;
var recorder = null;

// 导出渲染进程公共工具方法
const {drag_plus, dealFuncC, dealFuncQ, dealFuncP} = require('../utils/RendererUtils')

// 页面加载完成自动执行
window.onload = () => {
    // 获取摄像头视频流
    getMedia2();

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
            name: 'win-record', //【win-record】可在【frontend/src/views/base/window/Index.vue:67】进行配置 默认如果不配置就是【window-1】是【electron/controller/example.js.createWindow (args)】写死的name
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
    console.log(' === public/html/record_window.html', ' mouseenter ===')
})

// 监听鼠标出去
video.addEventListener('mouseleave', () => {
    console.log('=== public/html/record_window.html', ' mouseleave ===')
})

// 渲染进程公共工具
// 拖拽方法启用
drag_plus(video, "win-record")

// 键盘事件
// 相关介绍链接【https://juejin.cn/post/7029319401178398728】
// keydown：当任意按键被按下时触发；
// keypress: 它仅在产生字符值的键被按下时触发。举例来说，如果你按下键 a，此事件将会触发，因为 a 键产生了字符值 97 。当你按下 shift 键时不会触发此事件，因为它不会产生任何字符值；
// keyup：当任意按键被松开时触发
// ==================================================================================
// 按c键 是录制-录制摄像头 并且提示保存录像
// 按p键 是拍照 并且提示保存照片
// 按q键 退出窗口
window.addEventListener("keydown", function (event) {
    console.log('keydown => ', event.key, event.code); // keydown => p KeyP 注意按键区分大小写 Q KeyQ
    switch (event.key.toLowerCase()) { // 这里做不区分p大小写处理
        case 'c':
            // 处理录像
            dealFuncC(video,recorder)
            // 暂停视频
            fakeStopMedia()
            // 暂停录制 触发保留录制视频的 ondataavailable 事件
            stopRecord()
            break;
        case 'q':
            // 退出 暂停相关的
            stop_two()
            // 退出窗口
            dealFuncQ('win-record')
            break;
        case 'p':
            // 拍照
            dealFuncP(video, 'win-record')
            break;
        default:
            console.log('keydown switch default')
    }
});

// 此隐掉不要
// window.addEventListener("keypress", function (event) {
//     console.log('keypress => ',event.key,event.code);
// });

// 双击停止录像
video.ondblclick = () => {
    // 发送关闭摄像头通知-让主线程发送系统通知
    // window.dialogAPI.quitVedio("退出直播");
    ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '通知', body: '退出录制'})
    // 退出 暂停相关的
    stopAllWell()
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
    const is_ok = await ipcRenderer.invoke('controller.example.removeWCid', 'win-record');
}

// 右键是暂停和开始录制
video.oncontextmenu = () => {
    if (stop) {
        ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '通知', body: '继续录制'})
        this.start_two()
    } else {
        ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '通知', body: '暂停录制'})
        this.stop_two()
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

// 结束录制
function stopRecord() {
    if (recorder == null) {
        return
    }
    recorder.stop();
}

// 暂停录制
function pauseRecord() {
    if (recorder == null) {
        return
    }
    recorder.pause();
}

// 继续录制
function resumeRecord() {
    if (recorder == null) {
        return
    }
    recorder.resume();
}

// 暂停视频
// 暂停录制
function stop_two() {
    fakeStopMedia();
    pauseRecord(); // 暂停录制
}

// 视频 重新播放
// 继续录制
function start_two() {
    reStartMedia();
    resumeRecord(); //继续录制
}

// 停止所有
// 退出窗口
function stopAllWell(){
    // 暂停视频
    fakeStopMedia()
    // 暂停录制
    stopRecord()
    // 退出此窗口
    close_win()
}

// 获得视频流数据
// 录制
// 录制直播摄像头画面 并保存录像
function getMedia2() {
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
            // 创建录制器并且开始录制
            this.createRecorderAndStartRecord(MediaStream);
            this.videoStream = MediaStream;
            this.stop = false;
        })
        .catch(function (PermissionDeniedError) {
            // console.log(PermissionDeniedError);
            console.log('Error => ', PermissionDeniedError.name, PermissionDeniedError.message, " 未发现设备");
            var return_msg = 'Error => ' + PermissionDeniedError.name + PermissionDeniedError.message + " 未发现设备";
            // alert(return_msg)
            ipcRenderer.send('controller.example.showNotificationOnlyTitleANDBody', {title: '通知', body: return_msg})
        });
}

/**
 * 创建录制器
 *
 * @param stream 录制的流
 */
function createRecorderAndStartRecord(stream) {
    // 录制格式测试
    // const types = [
    //   "video/webm",
    //   "video/mp4",
    //   "audio/webm",
    //   "video/webm;codecs=vp8",
    //   "video/webm;codecs=daala",
    //   "video/webm;codecs=h264",
    //   "audio/webm;codecs=opus",
    //   "video/mpeg",
    // ];
    // for (const type of types) {
    //   console.log(
    //     `Is ${type} supported? ${
    //       MediaRecorder.isTypeSupported(type) ? "Maybe!" : "Nope :("
    //     }`
    //   );
    // }
    recorder = new MediaRecorder(stream);
    recorder.start();
    recorder.ondataavailable = async (event) => {
        let blob = new Blob([event.data], {
            type: "video/webm",
        });
        // 主线程去保存
        // console.log(blob);
        // todo 这一点待测试 看是否生效
        const is_ok = await ipcRenderer.invoke('controller.example.saveMovie', {name: 'win-record', this_buffer: blob});
    };
}
