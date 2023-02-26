<template>
  <div id="app-other">
    <div class="one-block-1">
      <span>
        调用摄像头 待开发...
        <a-button @click="openCamera()">获取所有可以被捕获的独立窗口</a-button>
        <a-button @click="openCamera2()">打开摄像头</a-button>
      </span>
      <a-divider>------------------------------------------------------------------</a-divider>
      <span>
        <a-textarea v-model="showtext" style="width: 700px;height: 100px" s></a-textarea>
      </span>
      <a-divider>------------------------------------------------------------------</a-divider>
      <a-textarea v-model="showtext2" style="width: 700px;height: 100px"></a-textarea>
      <a-divider>------------------------------------------------------------------</a-divider>
      <span>
        <video></video>
      </span>
    </div>
    <div class="one-block-2">
    </div>
  </div>
</template>
<script>

import {ipcApiRoute} from "@/api/main";

export default {
  data() {
    return {
      showtext:'',
      showtext2:''
    };
  },
  methods: {
    openCamera () {
      this.$ipcInvoke(ipcApiRoute.openCamera, {this_param: "123"}).then(res => {
        console.log('res:', res)
        this.showtext = '这是被捕获的所有独立窗口的信息 ==> '
        for (const re of res.DesktopCapturerSourceList) {
          this.showtext += JSON.stringify(re.get('id') + ' => ' +re.get('name') + ' | ')
        }
      })
    },
    openCamera2 () {
      this.$ipcInvoke(ipcApiRoute.openCamera2, {this_param: "123"}).then(async res => {
        this.showtext2 = '这是被捕获的独立窗口的信息 => '+ res.DesktopCapturerSourceList[0].get('id') + ' | ' + res.DesktopCapturerSourceList[0].get('name')
        console.log('res:', res)
        // 开始串流 渲染
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: res.DesktopCapturerSourceList[0].get('id') ,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720
              }
            }
          })
          console.log(stream)
          const video = document.querySelector('video')
          video.srcObject = stream
          video.onloadedmetadata = (e) => video.play()
        } catch (e) {
          console.log(e)
        }
      })
    }
  }
};
</script>
<style lang="less" scoped>
#app-other {
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
