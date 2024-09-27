// 指令注册
export default {
  directiveName: 'print',
  bind(el, binding, vnode) {
    let vue = vnode.context
    el.addEventListener('click', () => {
      vue.$nextTick(() => {
        new Print({
          id: binding.value.id, //  局部打印必传
          vue,
          url: binding.value.url || null, // 打印指定的网址，这里不能跟id共存 如果共存id的优先级会比较高
          standard: '', // 文档类型，默认是html5，可选 html5，loose，strict
          extraStyle: binding.value.extraStyle || null, // 额外的样式，多个逗号分开
          autoWidth: binding.value.autoWidth || null, // 自动计算宽度
          pageCompute: binding.value.pageCompute || false, // 页面采用计算方式
          splitTHeader: binding.value.splitTHeader || false, //分页  遇到表头是否切割
          format: Object.assign(
            {
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
            },
            binding.value.format || {}
          ), //portrait 纵向 landscape 横向
          zIndex: binding.value.zIndex || 20002, // 预览窗口的z-index
          popTitle: binding.value.popTitle, // title的标题
          preview: binding.value.preview || false, // 是否启动预览模式
          previewBeforeOpenCallback() {
            // 预览窗口打开之前的callback
            binding.value.previewBeforeOpenCallback && binding.value.previewBeforeOpenCallback(vue)
          },
          openCallback() {
            // 调用打印之后的回调事件
            binding.value.openCallback && binding.value.openCallback(vue)
          },
          beforeOpenCallback() {
            binding.value.beforeOpenCallback && binding.value.beforeOpenCallback(vue)
          },
          closeCallback() {
            //清理计算元素
            let _prints = document.querySelectorAll('._print_size_')
            let _autoWidths = document.querySelectorAll('._computed_width_')

            _prints.forEach((_el) => {
              document.body.removeChild(_el)
            })
            _autoWidths.forEach((_el) => {
              document.body.removeChild(_el)
            })

            binding.value.closeCallback && binding.value.closeCallback(vue)
          },
          logger: binding.value.logger || false // 是否打印日志
        })
      })
    })
  }
}

// print构造器
class Print {
  constructor(option) {
    this.standards = {
      strict: 'strict',
      loose: 'loose',
      html5: 'html5'
    }
    this.paper_format = null
    this.previewBody = null
    this.close_btn = null
    this.print_btn = null
    this.paper = { width: 0, height: 0 } //纸张大小
    this.paperPixel = { width: 0, height: 0 } //纸张像素
    this.autoWidth = {} //缓存计算宽度
    this.settings = {
      iframeId: 'print_iframe',
      standard: this.standards.html5,
      logger: false
    }
    this.default_paper = {
      A3: ['297mm', '420mm'],
      A4: ['210mm', '297mm'],
      A5: ['148mm', '210mm']
    }

    Object.assign(this.settings, option)

    this.init()
  }
  logger() {
    if (this.settings.logger) {
      console.log(...arguments)
    }
  }
  formatStringSplit = (str) => {
    const regex = /^(\d+)([a-z]+)$/i
    const match = str.match(regex) || []

    return [match[1], match[2]]
  }
  init() {
    let PrintAreaWindow = this.getPrintWindow() // 创建iframe

    if (this.settings.format.size) {
      let width = null
      let height = null
      if (typeof this.settings.format.size === 'string') {
        this.paper_format = this.settings.format.size || 'A4'
        ;[width, height] = this.default_paper[this.paper_format]
      } else {
        ;[width, height] = this.settings.format.size
      }

      if (!width) {
        console.error('print error paper size width is empty !')
      }

      let [_width, _width_format] = this.formatStringSplit(width)
      let [_height, _height_format] = this.formatStringSplit(height)

      this.logger('compute:', width, height, _width, _height, this.settings.format.scale)

      this.paper.width =
        this.settings.format.direction == 'landscape'
          ? _height * this.settings.format.scale + _height_format
          : _width * this.settings.format.scale + _width_format
      this.paper.height =
        this.settings.format.direction == 'landscape'
          ? _width * this.settings.format.scale + _width_format
          : _height * this.settings.format.scale + _height_format

      this.logger('compute:', width, height, _width, _height, this.settings.format.scale, this.paper)

      if (this.settings.pageCompute) {
        //初始化纸张大小
        this.computePaperPixel(PrintAreaWindow.doc, this.settings.format)
      }
    }

    //初始化自动计算缩放的box
    if (this.settings.autoWidth) {
      this.computeAutoWidthZoom(PrintAreaWindow.doc, this.settings.autoWidth)
    }

    if (!this.settings.url) {
      this.write(PrintAreaWindow.doc) // 写入内容
    }

    if (this.settings.preview) {
      // 打开预览弹窗
      this.previewIfrmaeLoad()
    } else {
      // 直接打印
      this.print(PrintAreaWindow)
    }
  }

  previewIfrmaeLoad() {
    let box = document.getElementById('vue-print-preview')

    if (box) {
      let _this = this
      let iframe = box.querySelector('iframe')

      this.settings.previewBeforeOpenCallback()
      iframe.onload = function () {
        _this.previewBoxShow()
        _this.settings.openCallback()
      }
      this.print_btn &&
        this.print_btn.addEventListener('click', function () {
          _this.settings.beforeOpenCallback()
          iframe.contentWindow.print()
          _this.settings.closeCallback()
        })
      this.close_btn &&
        this.close_btn.addEventListener('click', function () {
          _this.previewBoxHide()
        })
    }
  }
  iframeBox(iframeId, url) {
    let iframe = document.createElement('iframe')
    iframe.style.border = '0px'
    iframe.style.position = 'absolute'
    iframe.style.width = '0px'
    iframe.style.height = '0px'
    iframe.style.right = '0px'
    iframe.style.top = '0px'
    iframe.setAttribute('id', iframeId)
    iframe.setAttribute('src', url)

    return iframe
  }
  Iframe() {
    let iframeId = this.settings.iframeId
    let url = this.settings.url || new Date().getTime()

    let iframe = this.iframeBox(iframeId, url)

    try {
      // 直接打印 不预览
      if (!this.settings.preview) {
        document.body.appendChild(iframe)
      } else {
        iframe.setAttribute('style', 'border: 0px;flex: 1;')
        // 预览打印
        let previewBody = this.previewBox()
        // 添加ifrmae到预览弹窗
        previewBody.appendChild(iframe)
      }

      iframe.doc = null
      iframe.doc = iframe.contentDocument
        ? iframe.contentDocument
        : iframe.contentWindow
        ? iframe.contentWindow.document
        : iframe.document
    } catch (e) {
      throw new Error(e + '. iframe may not be supported in this browser.')
    }
    if (iframe.doc == null) {
      throw new Error('Cannot find document.')
    }

    return iframe
  }
  getPrintWindow() {
    var f = this.Iframe()
    return {
      f: f,
      win: f.contentWindow || f,
      doc: f.doc
    }
  }

  previewBox() {
    let box = document.getElementById('vue-print-preview')
    let previewBodyClass = 'print-preview-body'
    if (box) {
      box.querySelector('iframe') && box.querySelector('iframe').remove()

      return box.querySelector(`.${previewBodyClass}`)
    }
    let previewContent = document.createElement('div')
    previewContent.setAttribute('id', 'vue-print-preview')
    previewContent.setAttribute(
      'style',
      'position: fixed;top: 0px;left: 0px;width: 100%;height: 100%;background: white;display:none'
    )
    previewContent.style.zIndex = this.settings.zIndex
    // 打印预览弹窗的header
    let previewHeader = document.createElement('div')
    previewHeader.setAttribute('class', 'previewHeader')
    previewHeader.setAttribute('style', 'padding: 5px 20px;')
    previewHeader.innerHTML = '打印预览'
    previewContent.appendChild(previewHeader)

    // close关闭按钮
    let close = document.createElement('div')
    close.setAttribute('class', 'preview-close')
    close.setAttribute('style', 'position: absolute;top: 5px;right: 20px;width: 25px;height: 20px;cursor: pointer;')
    let closeBefore = document.createElement('div')
    let closeAfter = document.createElement('div')
    closeBefore.setAttribute('class', 'closeBefore')
    closeBefore.setAttribute(
      'style',
      'position: absolute;width: 3px;height: 100%;background: #040404;transform: rotate(45deg); top: 0px;left: 50%;'
    )
    closeAfter.setAttribute('class', 'closeAfter')
    closeAfter.setAttribute(
      'style',
      'position: absolute;width: 3px;height: 100%;background: #040404;transform: rotate(-45deg); top: 0px;left: 50%;'
    )
    close.appendChild(closeBefore)
    close.appendChild(closeAfter)
    previewHeader.appendChild(close)

    // 打印预览弹窗的body
    let previewBody = document.createElement('div')
    previewBody.setAttribute('class', previewBodyClass)
    previewBody.setAttribute('style', 'display: flex;flex-direction: column; height: 100%;')
    previewContent.appendChild(previewBody)
    // 打印预览弹窗的body的工具栏
    let previewBodyUtil = document.createElement('div')
    previewBodyUtil.setAttribute('class', 'previewBodyUtil')
    previewBodyUtil.setAttribute('style', 'height: 32px;background: #474747;position: relative;')
    previewBody.appendChild(previewBodyUtil)
    // 打印的按钮
    let print = document.createElement('div')
    print.setAttribute('class', 'print_btn')
    print.innerHTML = '打印'
    print.setAttribute(
      'style',
      'position: absolute;padding: 2px 10px;margin-top: 3px;left: 24px;font-size: 14px;color: white;cursor: pointer;background-color: rgba(0,0,0,.12);background-image: linear-gradient(hsla(0,0%,100%,.05),hsla(0,0%,100%,0));background-clip: padding-box;border: 1px solid rgba(0,0,0,.35);border-color: rgba(0,0,0,.32) rgba(0,0,0,.38) rgba(0,0,0,.42);box-shadow: inset 0 1px 0 hsla(0,0%,100%,.05), inset 0 0 1px hsla(0,0%,100%,.15), 0 1px 0 hsla(0,0%,100%,.05);'
    )
    previewBodyUtil.appendChild(print)

    // 添加整个预览到body
    document.body.appendChild(previewContent)

    this.close_btn = close
    this.print_btn = print
    this.previewBody = previewBody

    return previewBody
  }
  previewBoxShow() {
    let box = document.getElementById('vue-print-preview')
    if (box) {
      document.querySelector('html').setAttribute('style', 'overflow: hidden')
      box.style.display = 'block'
    }
  }

  previewBoxHide() {
    let box = document.getElementById('vue-print-preview')
    if (box) {
      document.querySelector('html').setAttribute('style', 'overflow: visible;')

      box.querySelector('iframe') && box.querySelector('iframe').remove()
      box.style.display = 'none'

      this.settings.closeCallback()
    }
  }
  print(ifrmae) {
    var _this = this
    let frame = document.getElementById(this.settings.iframeId)
    let iframe = frame || ifrmae.f
    let iframeWin = frame.contentWindow || ifrmae.f.contentWindow
    var _loaded = function () {
      iframeWin.focus()
      _this.settings.openCallback()
      iframeWin.print()
      iframe.remove()
      _this.settings.closeCallback()
    }
    _this.settings.beforeOpenCallback()
    iframe.onload = function () {
      _loaded()
    }
  }

  computePaperPixel = (doc, format) => {
    let dom = doc.createElement('div')
    dom.className = '_print_size_'
    dom.style.width = '0'
    dom.style.height = '0'

    let _dom = doc.createElement('div')
    _dom.className = '_print_width'
    _dom.style.width = this.paper.width
    _dom.style.height = this.paper.height
    dom.append(_dom)

    doc.body.append(dom)

    let x = (format.space.l + format.space.r) * format.scale
    let y = (format.space.t + format.space.b) * format.scale

    this.paperPixel.width = _dom.offsetWidth - x
    this.paperPixel.height = _dom.offsetHeight - y

    this.logger('compute: _getPaperSize', this.paperPixel)
  }
  computeAutoWidthZoom(doc, _class_s) {
    try {
      let _width = this.paperPixel.width
      _class_s.map((_class) => {
        // 获取表格
        let tables = Array.from(document.querySelectorAll(_class))

        let dom = doc.createElement('div')
        dom.className = '_computed_width_ _' + _class
        dom.style.width = _width + 'px'
        dom.style.height = '100%'
        doc.body.append(dom)

        tables.forEach((table, index) => {
          let cloneTable = table.cloneNode(true)
          cloneTable.style.zoom = '1'
          dom.append(cloneTable)
        })

        let newTables = Array.from(dom.querySelectorAll(_class))
        let maxWidth = Math.max(...newTables.map((el) => el.offsetWidth))

        this.autoWidth[_class] = maxWidth
        this.logger('compute: PrintAutoWidth', _class, maxWidth)
      })
    } catch (_error) {
      this.logger('_error', _error)
    }
  }
  // 根据type去处理form表单
  getFormData(ele) {
    let copy = ele.cloneNode(true)
    let copiedInputs = copy.querySelectorAll('input,select,textarea')
    let canvasImgList = copy.querySelectorAll('canvas')
    let selectCount = -1
    // 处理 canvas
    for (let i = 0; i < canvasImgList.length; i++) {
      let _parent = canvasImgList[i].parentNode
      let item = canvasImgList[i]
      // 删除克隆后的canvas节点
      if (item.tagName.toLowerCase() === 'canvas' && !item.style.display != 'none') {
        let _canvasUrl = canvasList[i].toDataURL('image/png')
        let _img = new Image()
        _img.src = _canvasUrl
        _parent.appendChild(_img)

        _parent.removeChild(item)
      }
    }
    // 处理 输入框
    for (let i = 0; i < copiedInputs.length; i++) {
      let item = copiedInputs[i]
      let typeInput = item.getAttribute('type')
      let copiedInput = copiedInputs[i]
      // 获取select标签
      if (!typeInput) {
        typeInput = item.tagName.toLowerCase || ''
      }
      // 处理input框
      if (item.tagName === 'INPUT') {
        // 除了单选框 多选框比较特别
        if (typeInput === 'radio' || typeInput === 'checkbox') {
          if (item.checked) {
            copiedInput.setAttribute('checked', item.checked)
          }
        } else {
          copiedInput.value = item.value
          copiedInput.setAttribute('value', item.value)
        }
        // 处理select
      } else if (typeInput === 'select') {
        selectCount++
        for (let b = 0; b < ele.querySelectorAll('select').length; b++) {
          let select = ele.querySelectorAll('select')[b] // 获取原始层每一个select
          !select.getAttribute('newbs') && select.setAttribute('newbs', b) // 添加标识
          if (select.getAttribute('newbs') == selectCount) {
            let opSelectedIndex = ele.querySelectorAll('select')[selectCount].selectedIndex
            item.options[opSelectedIndex].setAttribute('selected', true)
          }
        }
        // 处理textarea
      } else {
        copiedInput.innerHTML = item.value
        copiedInput.setAttribute('html', item.value)
      }
    }

    return copy
  }

  docType() {
    if (this.settings.standard === this.standards.html5) {
      return '<!DOCTYPE html>'
    }
    var transitional = this.settings.standard === this.standards.loose ? ' Transitional' : ''
    var dtd = this.settings.standard === this.standards.loose ? 'loose' : 'strict'

    return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01${transitional}//EN" "http://www.w3.org/TR/html4/${dtd}.dtd">`
  }
  getHead() {
    let extraHead = ''
    let links = ''
    let style = ''
    let otherStyle = ''
    if (this.settings.extraHead) {
      this.settings.extraHead.replace(/([^,]+)/g, (m) => {
        extraHead += m
      })
    }
    // 复制所有link标签
    ;[].forEach.call(document.querySelectorAll('link'), function (item) {
      if (item.href.indexOf('.css') >= 0) {
        links += `<link type="text/css" rel="stylesheet" href="${item.href}" >`
      }
    })
    // 循环获取style标签的样式
    let domStyle = document.styleSheets
    if (domStyle && domStyle.length > 0) {
      for (let i = 0; i < domStyle.length; i++) {
        try {
          if (domStyle[i].cssRules || domStyle[i].rules) {
            let rules = domStyle[i].cssRules || domStyle[i].rules
            for (let b = 0; b < rules.length; b++) {
              style += rules[b].cssText
            }
          }
        } catch (e) {
          console.warn(domStyle[i].href + e)
        }
      }
    }
    //自定义样式
    if (this.settings.extraStyle) {
      for (let i = 0; i < this.settings.extraStyle.length; i++) {
        otherStyle += this.settings.extraStyle[i]
      }
    }
    //默认打印格式
    otherStyle += `
                    html,body{
                          margin: 0 !important;
                          padding: 0 !important;
                          height:auto !important;
                    }
                    #print-paper{
                        position:relative;
                        width: ${this.paper.width};
                        height: ${this.paper.height};
                        padding: ${this.settings.format.space.t}px ${this.settings.format.space.r}px ${this.settings.format.space.b}px ${this.settings.format.space.l}px;
                        overflow: hidden;
                    }
                    .print-header-title{
                      position:absolute;
                      top:0;
                      right:0;
                      left:0;
                      text-align:center;
                      color: #999;
                      line-height: 24px;
                    }
                    .print-footer-title{
                      position:absolute;
                      bottom:0;
                      right:0;
                      left:0;
                      text-align:center;
                      color: #999;
                      line-height: 24px;
                    }
                    @media print {
                        @page {
                          size: ${this.paper_format} ${this.settings.format.direction};
                          margin: 0mm;
                          padding: 0mm;
                        }
                        * {
                          -webkit-print-color-adjust: exact;
                        }
                        *::-webkit-scrollbar {
                          display: none;
                         }
                         .el-form-item__label::before {
                          content: '' !important;
                         }
                         .print-hidden{
                           display:none !important;
                         }
                    }`

    return `<head><title>${this.settings.popTitle}</title>${extraHead}${links}<style type="text/css">${style}</style><style type="text/css">${otherStyle}</style></head>`
  }
  getBody() {
    let id = this.settings.id
    let dom = document.getElementById(id)
    this.elsdom = dom
    let ele = this.getFormData(dom)
    let htm = ele.outerHTML
    if (this.settings.pageCompute) {
      return `<body> <div style="width:${this.paper.width};padding-left: ${this.settings.format.space.l}px;padding-right: ${this.settings.format.space.r}px" >${htm}</div></body>`
    }
    return `<body>${htm}</body>`
  }

  write(PADocument) {
    let _this = this

    PADocument.open()
    PADocument.write(`${this.docType()}<html>${this.getHead()}${this.getBody()}</html>`)
    PADocument.close()
    // 手动切割
    if (this.settings.pageCompute) {
      _this.settings.openCallback = function () {
        _this.logger('print autoCompute start', _this.paperPixel, _this.settings.format)

        let paperTemplateId = new splitPage(
          PADocument,
          PADocument.getElementById(_this.settings.id),
          _this.paperPixel,
          _this.settings.format,
          {
            splitTHeader: _this.settings.splitTHeader,
            autoWidth: _this.autoWidth,
            logger: _this.settings.logger
          }
        ).init()
        PADocument.body.innerHTML = ''
        paperTemplateId.forEach((item) => {
          PADocument.body.append(item)
        })

        _this.logger('print autoCompute end', paperTemplateId)
      }
    }
  }
}

// data-print  table 表格处理 ignore 忽略计算  whole 完整体
class splitPage {
  constructor(doc, el, size, format, option) {
    this.pageFormat = format
    //分页的根节点   不可携带关联类
    this.doc = doc
    //分页的根节点   不可携带关联类
    this.el = el
    //当前页面组
    this.pages = []
    //纸张大小
    this.paperPixel = size
    //已填写内容高度
    this.paperHeight = 0
    //已填写内容
    this.paper = null
    //根模板
    this.rootTemplate = null
    //换页的模板 新页面内容挂载到当前模板
    this.domId = 0
    this.pageNumber = 0

    this.option = option || {}
  }
  logger() {
    if (this.option && this.option.logger) {
      console.log(...arguments)
    }
  }
  init() {
    //首页复制模板
    let _rootTemplate = this.doc.createElement('div')
    _rootTemplate.setAttribute('id', 'print-paper')

    this.rootTemplate = _rootTemplate

    this.paper = this.rootTemplate.cloneNode()

    this.splitTask(this.el, null, null, null, 0, true)
    return this.pages
  }
  nextPage(state) {
    //更新页面序号
    this.pageNumber++
    //添加 页脚
    if (this.pageFormat.header) {
      let div = this.doc.createElement('div')
      div.className = 'print-header-title'
      div.innerText = this.pageFormat.header
      this.paper.append(div)
    }
    //添加页眉
    if (this.pageFormat.footer) {
      let div = this.doc.createElement('div')
      div.className = 'print-footer-title'
      div.innerText = this.pageFormat.footer + '  第' + this.pageNumber + '页'
      this.paper.append(div)
    }
    //保存上一页
    this.pages.push(this.paper)
    if (state) {
      return
    }
    //记录高度
    this.paperHeight = 0
    this.logger('添加新页 记录纸张边距为默认高度', this.paperHeight)
  }
  /**
   * 切割任务
   * @param {*} el 需要切割的节点
   * @param {*} paperLine 纸张中处理的节点
   * @param {*} paperTemplate 纸张模板层
   * @param {*} paperTemplateId 纸张模板层中处理节点的id
   * @param {*} paperTemplateHeight 纸张模板层的默认高度
   * @param {*} root 是否为根节点
   */
  splitTask(el, paperLine, paperTemplate, paperTemplateId, paperTemplateHeight = 0, root) {
    if (root) {
      this.logger('start Task---------------------------------')
    } else {
      this.logger(
        'splitTask-task  \n任务元素：',
        el,
        '\n克隆页面元素：',
        paperLine,
        '\n父模板：',
        paperTemplate,
        '\n父模板高度：',
        paperTemplateHeight,
        '\n父元素ID：',
        paperTemplateId
      )
    }
    let _this = this
    //获取所有元素
    let children = el.children
    for (let i = 0; i < children.length; i++) {
      // 元素层 id
      let id = this.domId++
      // 当前元素节点
      let _el = children[i]
      let classList = Array.from(_el.classList).map((el) => '.' + el)
      // 当前元素设置id
      _el.setAttribute('print', id)

      //预处理自适应元素
      if (this.option.autoWidth) {
        let find_auto_width_dom = classList.find((el) => this.option.autoWidth[el])
        if (find_auto_width_dom) {
          let maxWidth = this.option.autoWidth[find_auto_width_dom]
          let parentWidth = _el.parentElement.offsetWidth
          let scale = parentWidth > maxWidth ? 1 : parentWidth / maxWidth
          _el.style.zoom = scale
          this.logger('autoWidth ', this.option.autoWidth, classList, find_auto_width_dom, maxWidth, parentWidth, scale)
        }
      }

      // 克隆的模板层
      let cloneNode
      // 当前行的处理模板
      let _paperLine = this.paper.querySelector('[print="' + paperTemplateId + '"]') || paperLine || this.paper
      // 克隆的父页面模板层
      let _paperTemplate = (paperTemplate && paperTemplate.cloneNode(true)) || this.rootTemplate.cloneNode()
      // 获取父页面模板层中的父元素
      let _templateLayerNode =
        (paperTemplateId && _paperTemplate.querySelector('[print="' + paperTemplateId + '"]')) || _paperTemplate

      // 创建新模板
      function newTemplate() {
        _this.nextPage()

        let clone_template = _paperTemplate.cloneNode(true)

        _this.paper = clone_template
        _paperLine = paperTemplateId
          ? clone_template.querySelector('[print="' + paperTemplateId + '"]')
          : clone_template

        //重置高度
        _this.paperHeight += paperTemplateHeight

        _this.logger(
          'next_3 新页面',
          '\n_paperLine',
          _paperLine,
          '\npaper',
          _this.paper,
          '\npaperHeight',
          _this.paperHeight
        )
      }

      //获取当前元素高    处理内容
      let elHeight = this.getRealHeight(_el)

      this.logger(
        'next_1 \n当前纸张：',
        this.paper.cloneNode(true),
        '\n当前行的处理模板:',
        _paperLine,
        '\n克隆的父页面模板层:',
        _paperTemplate,
        '\n获取父页面模板层中的父元素',
        _templateLayerNode
      )
      this.logger(
        'next_2 \n当前元素：',
        _el,
        '\n元素高度：',
        elHeight,
        '\n纸张高度：',
        this.paperHeight,
        '\n纸张总高度：',
        this.paperPixel.height,
        '\n未超出：',
        this.paperHeight + elHeight <= this.paperPixel.height
      )

      //匹配 忽略项
      if (this.checkCss(_el) || _el.getAttribute('data-print') == 'ignore') {
        this.logger(`element ${id} ignore handler`)

        // 匹配 未有子元素 or 整体内容且当前元素应当小于页面高度
      } else if (_el.children.length == 0 || _el.getAttribute('data-print') == 'whole') {
        if (this.paperHeight + elHeight <= this.paperPixel.height) {
          cloneNode = _el.cloneNode(true)

          //添加到模板中
          root ? this.paper.append(cloneNode) : _paperLine.append(cloneNode)

          this.paperHeight += elHeight

          this.logger(`element ${id} whole inner handler`)
        } else {
          newTemplate()

          //克隆当前元素
          let cloneDom = _el.cloneNode(true)
          //使用当前模板
          _paperLine.append(cloneDom)
          //创建新页面模板后 将模板对象挂载paper

          this.paperHeight += elHeight

          //在新模板上添加
          this.logger(`element ${id}  whole page handler`, this.pages, this.paperHeight)
        }
        // 匹配 默认切割
      } else if (_el.getAttribute('data-print') == 'table') {
        if (this.paperHeight + elHeight <= this.paperPixel.height) {
          _paperLine.append(_el.cloneNode(true))

          this.paperHeight += elHeight

          this.logger(`element ${id} table whole inner handler`)

          continue
        }

        //初始化模板层
        this.logger('element dom table', _paperTemplate, _paperLine)
        let zoom = this.getStyle(_el).zoom || 1
        //获取当前空模板
        let cloneTableTemplate = _el.cloneNode()
        let tHeader = _el.children[0]
        let tHeaderHeight = this.getRealHeight(tHeader, zoom)
        let tBody = _el.children[1]
        let cloneTBody = tBody.cloneNode()
        let tChildren = tBody.children
        let tdColTemplate = []
        //记录拓展tr位置
        try {
          for (let t = 0; t < tChildren.length; t++) {
            let i = 0
            let match = {
              tr_s: t,
              tr_e: 0,
              tds: []
            }
            for (let _t = 0; _t < tChildren[t].children.length; _t++) {
              let _td = tChildren[t].children[_t]
              if (_td.rowSpan > 1) {
                i++
                if (match.tr_e < _td.rowSpan) {
                  match.tr_e = t + _td.rowSpan
                }
                match.tds.push({
                  td_i: _t, //当前起始列
                  span: _td.rowSpan,
                  td: _td
                })
              }
            }
            i > 0 && tdColTemplate.push(match)
          }
        } catch (error) {
          this.logger('暂存的tr err', error)
        }
        this.logger('暂存的tr', tdColTemplate)

        //换页符
        let next = false
        for (let c = 0; c < tChildren.length; c++) {
          let tr = tChildren[c]

          let trHeight = this.getRealHeight(tr, zoom)
          //this.logger("tr", tr, trHeight)
          //计算 表头 加 行高 ， 是否符合高度
          this.logger('tr-next', next, this.paperHeight, tHeaderHeight, trHeight, zoom, this.option)
          let trClone = tr.cloneNode(true)
          //this.logger('tr-clone', trClone);

          //判断剩余内容是否足够 头部
          if (
            (c == 0 && this.paperHeight + tHeaderHeight + trHeight >= this.paperPixel.height) ||
            (c != 0 && this.paperHeight + trHeight >= this.paperPixel.height)
          ) {
            this.logger('table new page', cloneTBody)
            if (c == 0) {
              newTemplate()
            } else {
              cloneTableTemplate.append(cloneTBody)
              //添加至页面中
              _paperLine.append(cloneTableTemplate)
              this.logger('table ', _paperLine.cloneNode(true))
              // 换页
              newTemplate()

              //重置body
              cloneTBody = tBody.cloneNode()
              cloneTableTemplate = _el.cloneNode()

              next = true
            }
          }

          //第一次计算header
          if ((this.option.splitTHeader && next) || (!this.option.splitTHeader && c == 0)) {
            cloneTableTemplate.append(tHeader.cloneNode(true))
            this.paperHeight += tHeaderHeight
          }

          //计算其他tr
          if (this.paperHeight + trHeight <= this.paperPixel.height) {
            if (next) {
              //重置过后 再次记录
              tdColTemplate.forEach((item) => {
                if (item.tr_s <= c && c < item.tr_e) {
                  item.tds.forEach((_item) => {
                    this.logger('page split rowspan', c, item, _item, _item.span >= c)

                    let cloneTd = _item.td.cloneNode()
                    let insertDom = trClone.children[_item.td_i]

                    cloneTd.rowSpan = item.tr_e - c
                    trClone.insertBefore(cloneTd, insertDom)
                  })
                }
              })

              next = false
            } else {
              this.paperHeight += trHeight
            }

            cloneTBody.append(trClone)
          }
        }
        cloneTableTemplate.append(cloneTBody)
        //添加至页面中
        _paperLine.append(cloneTableTemplate)

        this.logger('cloneDom---table', tHeader, tBody, cloneTableTemplate)
      } else {
        //克隆内容层模板
        cloneNode = (_paperLine && _paperLine.querySelector('[print="' + id + '"]')) || _el.cloneNode()
        //this.logger("打印模板层", cloneNode.cloneNode(true))
        let cloneLayer = _el.cloneNode()
        //添加当前模板层 添加到 父模板层
        _templateLayerNode ? _templateLayerNode.append(cloneLayer) : _paperTemplate.append(cloneLayer)
        //添加到纸张中
        root ? this.paper.append(cloneNode) : _paperLine.append(cloneNode)
        //设置父级默认高度
        let otherHeight = this.getOtherHeight(_el)
        this.paperHeight += otherHeight

        this.logger(`element ${id} split`, '其他高度：', otherHeight, '纸张高度', this.paperHeight)
        //传入当前元素 and 当前父级模板
        this.splitTask(_el, cloneNode, _paperTemplate, id, paperTemplateHeight + otherHeight, false)
      }
      //当处理完最后一个元素时  保存页面
      if (root && i == children.length - 1) {
        this.nextPage(true)
      }
    }
  }
  //检查属性 data-print  block table
  checkAttr(el) {
    return el.getAttribute('data-print')
  }
  //检查样式 float absolute overflow
  checkCss(el) {
    const style = this.getStyle(el)
    return (
      // style.float == "right" ||
      // style.float == "left" ||  暂不处理
      style.position == 'absolute' || style.position == 'fixed'
      // || style.overflow == "hidden"
    )
  }
  getStyle(obj) {
    if (obj.currentStyle) {
      //兼容IE
      return obj.currentStyle
    } else {
      return getComputedStyle(obj, false)
    }
  }
  getOtherHeight(dom) {
    let style = this.getStyle(dom)
    let margin =
      parseFloat(style.marginTop ? style.marginTop.split('px')[0] : 0) +
      parseFloat(style.marginBottom ? style.marginBottom.split('px')[0] : 0) +
      parseFloat(style.paddingTop ? style.paddingTop.split('px')[0] : 0) +
      parseFloat(style.paddingBottom ? style.paddingBottom.split('px')[0] : 0)
    return margin
  }
  getRealHeight(dom, zoom) {
    let style = this.getStyle(dom)
    let margin =
      parseFloat(style.marginTop ? style.marginTop.split('px')[0] : 0) +
      parseFloat(style.marginBottom ? style.marginBottom.split('px')[0] : 0)
    // zoom &&this.logger('getRealHeight-zoom', zoom, margin, dom.offsetHeight)
    let height = zoom ? dom.offsetHeight * zoom : style.zoom ? dom.offsetHeight * style.zoom : dom.offsetHeight
    return margin + height
  }
}
