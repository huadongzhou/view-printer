# view-printer

> [!NOTE]
> This is the repository for Vue 2
> Next support Vue 3 ......

<h2 align="center">This plugin supports both local and global printing of browser pages</h2>
  
<br/>

## Status

- vue 2: Support
- vue 3: Lazy

## Know Me

- Magic Transformation Project [vue-print-nb](https://www.npmjs.com/package/vue-print-nb)

## Quickstart

- Add it to an existing Vue Project:

  ```bash
  npm install view-printer  --save
  ```

- import it to an existing Vue Project:

  ```bash
  import printer from 'view-printer'

  Vue.direction(printer)
  ```

- use it to an existing Vue Project:

  ```bash
  <template>
    <button v-print="printInfo"></button>
  </template>
  <script>
  export default{
    data(){
      return {
        printInfo:{
          id: ''
        }
      }
    }
  }
  </script>

  Vue.direction(printer)
  ```

## Update log

1.0.2 version support vue2

## Lib Params

<table>
    <tr>
      <th><span style="width:150px;display:inline-block;">属性</span></th>
      <th>类型</th>
      <th><span style="width:50px;display:inline-block;">默认值</span></th>
      <th>描述</th>
    </tr> 
     <tr>
      <th><span style="width:150px;display:inline-block;">id</span></th>
      <th>String</th>
      <th><span style="width:50px;display:inline-block;"></span></th>
      <th>局部打印必传 不传默认全局打印</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">url</span></th>
      <th>String</th>
      <th><span style="width:50px;display:inline-block;"></span></th>
      <th>异步打印  需传入异步地址</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">standard</span></th>
      <th>String</th>
      <th><span style="width:50px;display:inline-block;">html5</span></th>
      <th>渲染模板的HTML标准 值：html5，loose，strict</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">autoWidth</span></th>
      <th>Array</th>
      <th><span style="width:50px;display:inline-block;"></span></th>
      <th>类样式数组   根据查询的元素  匹配当前纸张进行缩放显示   设计是为了table元素  </th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">pageCompute</span></th>
      <th>Boolean</th>
      <th><span style="width:50px;display:inline-block;">false</span></th>
      <th> true 手动切割页面  false 浏览器切割页面 </th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">splitTHeader</span></th>
      <th>Boolean</th>
      <th><span style="width:50px;display:inline-block;">false</span></th>
      <th>  pageCompute未true时 处理table分页   true table只有一个theader  false  table根据切割有多个theader </th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">format</span></th>
      <th>Object</th>
      <th><span style="width:50px;display:inline-block;">
        `{
            size: '',
            direction: 'landscape',
            header: '',
            footer: '',
            scale: 1,
            space: {
              t: 0,
              r: 0,
              b: 0,
              l: 0
            }
          }`
      </span></th>
      <th>根据传入格式渲染在纸张大小 方向 页头 页脚</th>
    </tr>
    <tr>
      <th><span style="width:150px;display:inline-block;">preview</span></th>
      <th>Boolean</th>
      <th><span style="width:50px;display:inline-block;"> false </span></th>
      <th>打印前的预览</th>
    </tr>
     <tr>
      <th><span style="width:150px;display:inline-block;">zIndex</span></th>
      <th>Number</th>
      <th><span style="width:50px;display:inline-block;"> 20002 </span></th>
      <th>预览界面的z-index   避免与其他样式冲突</th>
    </tr>
     <tr>
      <th><span style="width:150px;display:inline-block;">logger</span></th>
      <th>Boolean</th>
      <th><span style="width:50px;display:inline-block;"> 20002 </span></th>
      <th>debug 模式</th>
    </tr> 
  </table>

## Format Params

<table>
    <tr>
      <th><span style="width:150px;display:inline-block;">属性</span></th>
      <th>类型</th>
      <th><span style="width:50px;display:inline-block;">默认值</span></th>
      <th>描述</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">size</span></th>
      <th>string | array</th>
      <th><span style="width:50px;display:inline-block;"></span></th>
      <th>A3 A4 A5 ||  ['1920px','1080px']</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">direction</span></th>
      <th>string</th>
      <th><span style="width:50px;display:inline-block;">landscape</span></th>
      <th>landscape 纵向 ||  portrait 横向</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">scale</span></th>
      <th>Number</th>
      <th><span style="width:50px;display:inline-block;">1</span></th>
      <th>缩放比例 比例越大横向显示越完整 因为浏览器是按宽高比缩放</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">space</span></th>
      <th>Object</th>
      <th><span style="width:50px;display:inline-block;">{  t: 0,  r: 0,  b: 0, l: 0 }</span></th>
      <th>纸张的边框</th>
    </tr>  
  </table>

## Method For Print

<table>
    <tr>
      <th><span style="width:150px;display:inline-block;">方法</span></th>
      <th>参数</th>
      <th><span style="width:50px;display:inline-block;">返回</span></th>
      <th>描述</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">previewBeforeOpenCallback</span></th>
      <th>（vue）</th>
      <th><span style="width:50px;display:inline-block;"></span></th>
      <th>预览窗口打开之前的callback</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">openCallback</span></th>
      <th>（vue）</th>
      <th><span style="width:50px;display:inline-block;"></span></th>
      <th>调用打印之后的回调事件</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">beforeOpenCallback</span></th>
      <th>（vue）</th>
      <th><span style="width:50px;display:inline-block;"> </span></th>
      <th>调用打印前的回调事件</th>
    </tr> 
    <tr>
      <th><span style="width:150px;display:inline-block;">closeCallback</span></th>
      <th>（vue）</th>
      <th><span style="width:50px;display:inline-block;"> </span></th>
      <th>打印完成后的事件</th>
    </tr>  
  </table>

## 喝杯咖啡

如果能帮到你 我很高兴！！！ 来杯咖啡刺激开发进度

<img
    src="https://raw.githubusercontent.com/huadongzhou/view-printer/master/coffee.jpg"
      width="400px"
    />
