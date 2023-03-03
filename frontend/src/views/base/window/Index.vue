<template>
  <div id="app-base-window">
    <div class="one-block-1">
      <span>
        1. 新窗口中加载web内容
      </span>
    </div>
    <div class="one-block-2">
      <a-space>
        <a-button @click="createWindow(0)">打开哔哩哔哩</a-button>
      </a-space>
    </div>
    <div class="one-block-1">
      <span>
        2. 新窗口中加载html内容
      </span>
    </div>
    <div class="one-block-2">
      <a-space>
        <a-button @click="createWindow(1)">打开html页面</a-button>
        <a-button @click="createWindow(3)">打开直播摄像头页面</a-button>
        <a-button @click="createWindow(4)">打开录制摄像头页面</a-button>
      </a-space>
    </div>
    <div class="one-block-1">
      <span>
        3. 新窗口中加载当前项目页面
      </span>
    </div>
    <div class="one-block-2">
      <a-space>
        <a-button @click="createWindow(2)">打开vue页面</a-button>
      </a-space>
    </div>
  </div>
</template>
<script>
import {ipcApiRoute, specialIpcRoute} from '@/api/main'

export default {
  data() {
    return {
      views: [
        {
          type: 'web',
          content: 'https://www.bilibili.com/'
        },
        {
          type: 'html',
          content: '/public/html/view_example.html'
        },
        {
          type: 'vue',
          content: '/#/special/subwindow'
        },
        {
          type: 'html',
          windowName:'win-camera', // 想要只能打开一个窗口的页面 需要自己定义一个窗口名称 不可以叫【window-1】 其他名称均可以
          content: '/public/html/camera/vedio_window.html',
          height: 200, // 自己可以在此扩展属性 对应修改【electron/controller/example.js.createWindow (args)】中的opt参数代码
          width: 200,
          frame: false, // 为 false 可以去掉 顶部导航 去掉关闭|最大化|最小化|按钮 默认值是 true
          transparent: true // 将 transparent 选项设置为 true, 可以使无框窗口透明 默认值为 false
        },
        {
          type: 'html',
          windowName:'win-record', // 想要只能打开一个窗口的页面 需要自己定义一个窗口名称 不可以叫【window-1】 其他名称均可以
          content: '/public/html/record/record_window.html',
          height: 200, // 自己可以在此扩展属性 对应修改【electron/controller/example.js.createWindow (args)】中的opt参数代码
          width: 200,
          frame: false, // 为 false 可以去掉 顶部导航 去掉关闭|最大化|最小化|按钮 默认值是 true
          transparent: true // 将 transparent 选项设置为 true, 可以使无框窗口透明 默认值为 false
        },
      ],
    };
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      console.log('frontend/src/views/base/window/Index.vue',' 已初始化监听窗口2发来的消息 ')
      // 监听 窗口2 发来的消息
      this.$ipc.removeAllListeners(specialIpcRoute.window2ToWindow1);
      this.$ipc.on(specialIpcRoute.window2ToWindow1, (event, arg) => {
        this.$message.info(arg);
      })
    },
    createWindow(index) {
      this.$ipcInvoke(ipcApiRoute.createWindow, this.views[index]).then(r => {
        console.log(r);
      })
    },
  }
};
</script>
<style lang="less" scoped>
#app-base-window {
  padding: 0px 10px;
  text-align: left;
  width: 100%;
  .one-block-1 {
    font-size: 16px;
    padding-top: 10px;
  }
  .one-block-2 {
    padding-top: 10px;
  }
}
</style>
