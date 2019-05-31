/**
* @file 构建一个module对象
**/

const path = require('path')
const utils = require('../utils/index.js')
let moduleId = 0
let prohibitAttrs = ['depends', 'parentModule', 'info', 'warning']
/**
 * 创建一个模块
 * @param {string} filePath  模块绝对路径
 * @param {buffer} source    模块源
 */
function Module(filePath, source) {  
  if (!(this instanceof Module)) {
    return new Module
  }

  // 一般以路径作为唯一id
  this.id = null

  // 模块源内容 必须buf
  this.source = null

  // 模块名称 （文件名）
  this.fileName = ''

  // 绝对路径
  this.filePath = ''

  // 模块文件后缀 根据该后缀类型来加载不同的loader
  this.suffix = ''

  // 模块依赖 [{module:module}...]
  this.depends = []

  // 父模块
  this.parentModule = {}

  // 模块类型|来源 仅三种值 ('external' || 'package' || 'project')
  this.origin = ''

  // 静态资源？
  this.isStatic = false

  // 模块信息(loader解析出来的信息)
  // value、label、value、description
  this.info = {}

  // 模块的槽点...被检查出来的危险信息
  // 包括 type ('warning' || 'error') 、 message描述、standard标准值、actual实际值
  this.warning = []

  // 其他自定义参数 codev不会访问
  this.customize = {}

  // 设置模块基础信息
  this.setBaseInfo(filePath, source)

  // 初始化module.tools对象（以备外部操作module）
  this.tools = {
    addDepend: this.addDepend.bind(this),
    addParentModule: this.addParentModule.bind(this),
    addInfo: this.addInfo.bind(this),
    getInfo: this.getInfo.bind(this),
    getAttr: this.getAttr.bind(this),
    addWarning: this.addWarning.bind(this),
  }
}

Module.prototype.getAttr = function (name) {
  if (prohibitAttrs.indexOf(name) > -1) {
    return null
  }
  
  return this[name]
}

Module.prototype.setBaseInfo = function (filePath, source) {
  if (!filePath) {
    utils.error(`Module creation failed, Missing module path`)
    utils.exit()
  }

  const basename = path.parse(filePath)
  const suffix = basename.ext
  const fileType = suffix.indexOf('?') > -1 ? suffix.split('?')[0] : suffix
  const fileName = basename.name

  this.id = this.filePath = filePath
  this.fileName = fileName
  this.suffix = fileType
  this.source = source || null
}

Module.prototype.addDepend = function (dep) {
  const depends = Array.isArray(dep) ? dep : [dep]
  this.depends = this.depends.concat(depends)
}

Module.prototype.addParentModule = function (module) {
  this.parentModule[module.id] = module
}

Module.prototype.addWarning = function (warning) {
  if (warning.type && warning.message) {
    this.warning.push(warning)
  } else {
    utils.warning(`type ​​and message are required in (${JSON.stringify(warning)})`)
    return
  }
}

Module.prototype.addInfo = function (infos) {
  infos = Array.isArray(infos) ? infos : [infos]
  for (let i = 0; i < infos.length; i ++) {
    const info = infos[i]

    // 必须要填写一个值和label
    if (utils.isNot(info.value) || !info.label) {
      utils.error(`Value ​​and label are required`)
      return
    }

    // 值只能是string, number, boolean , string[]
    if (!utils.isBase(info.value) || (Array.isArray(info.value) && !utils.isStringArr(info.value))) {
      utils.error(`Values ​​can only be strings、 arrays、 numbers、 booleans and string[]`)
      return
    }

    // 默认 module
    // 'private' 该条信息不会被统计到项目概览 'public' 会被统计到项目概览
    info.type = info.type || 'private'
    info.description = info.description || ''

    // 如果存在相同的信息警告
    if (this.info[info.label]) {
      utils.warning(`The same information already exists and covered in [${info[info.label]}]`)
    }

    this.info[info.label] = info
  }
}

Module.prototype.getInfo = function (label) {
  return this.info[label] || null
}

module.exports = Module