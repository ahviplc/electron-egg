<template>
  <div id="app-other">
    <div class="one-block-1">
      <span>
        <p style="text-align: center">直播 桌面窗口捕获 推流...</p>
         <a-divider>------------------------------------------------------------------</a-divider>
        <a-button @click="openCamera()">获取所有可以被捕获的独立窗口</a-button>
        <a-button @click="openCamera2()">桌面单窗口捕获</a-button>
      </span>
      <!--{{item_list}}-->
      <a-divider>------------------------------------------------------------------</a-divider>
      <span>
          <a-radio-group>
             <a-radio
                 v-for="item in item_list"
                 :key="item.id"
                 :value="item.id"
                 :name="item.name"
                 @change="change_me"
             >{{ item.name }}-{{ item.id }}</a-radio>
      </a-radio-group>
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
      showtext: '',
      showtext2: '',
      item_list: [],
      stream_map: new Map()
    };
  },
  mounted() {
    console.log('mounted ...')
  },
  methods: {
    openCamera() {
      this.$ipcInvoke(ipcApiRoute.openCamera, {this_param: "123"}).then(res => {
        // console.log('res:', res)
        this.showtext = '这是被捕获的所有独立窗口的信息 ==> '
        this.item_list = res.DesktopCapturerSourceList
        for (const re of this.item_list) {
          this.showtext += JSON.stringify(re.id + ' => ' + re.name + ' | ')
        }
      })
    },
    openCamera2() {
      this.$ipcInvoke(ipcApiRoute.openCamera2, {this_param: "456"}).then(async res => {
        var this_source_id = res.DesktopCapturerSourceList[0].id;
        this.showtext2 = '这是被捕获的独立窗口的信息 => ' + this_source_id + ' | ' + res.DesktopCapturerSourceList[0].name
        console.log('res:', res)
        // 开始串流 渲染
        try {
          if (!this.stream_map.has(this_source_id)) {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: this_source_id,
                  minWidth: 1280,
                  maxWidth: 1280,
                  minHeight: 720,
                  maxHeight: 720
                }
              }
            })
            this.stream_map.set(this_source_id, stream)
          } else {
            console.log('openCamera2 已存在stream')
          }
          console.log('openCamera2', this.stream_map.get(this_source_id))
          const video = document.querySelector('video')
          video.srcObject = this.stream_map.get(this_source_id)
          video.onloadedmetadata = (e) => video.play()
        } catch (e) {
          console.log(e)
        }
      })
    },
    async change_me(e) { // 选项变化时的回调函数
      var chromeMediaSourceId = e.target.value;
      // alert(chromeMediaSourceId)
      // 开始串流 渲染
      try {
        if (!this.stream_map.has(chromeMediaSourceId)) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: chromeMediaSourceId,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720
              }
            }
          })
          this.stream_map.set(chromeMediaSourceId, stream)
        } else {
          console.log('change_me 已存在stream')
        }
        console.log('change_me', this.stream_map.get(chromeMediaSourceId))
        const video = document.querySelector('video')
        video.srcObject = this.stream_map.get(chromeMediaSourceId)
        video.onloadedmetadata = (e) => video.play()
      } catch (e) {
        console.log(e)
      }
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
