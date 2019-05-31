/**
* @file 项目主程序（入口文件）
**/
const webpackMerge = require('webpack-merge')
const merge = webpackMerge(({
  customizeArray: function (a, b) { return b }
}));

/**
 * 主程序
 * @param {object} options 选项
 */
function Codev(options) {
  if (!(this instanceof Codev)) {
    this.utils.warning(`Need to use the 'new' keyword`)
    return new Codev(options)
  }

  // 实例添加到构造函数
  Codev.codev = this

  // 处理选项
  // 复制一份配置到codev以便外部访问，该codev.options配置仅供访问使用 codev.options !== options
  this.options = merge({}, resolveOption(options))

  // 开始构建
  this._init(options)
}

/**
 * start
 * @param  {object} options 构建对象
 * @return {undefined}         
 */
module.exports = Codev

const buildDependTree = require('./buildDependTree.js')
const event = require('./core/event.js')
const loaders = require('./loaders/index.js')
const utils = require('./utils/index.js')
const resolveOption = require('./resolveOption.js')
const Module = require('./core/Module.js')
const plugin = require('./plugins/index.js')
const rules = require('./rules/index.js')
const statistics = require('./statistics/index.js')

Codev.prototype._init = async function (options){
  // 注册事件
  event.addList(options.hooks)

  // 注册插件
  plugin.addPlugin(options.plugins, this)

  // 触发开始构建事件
  event.emit('codevStart')

  console.log(new Date().getTime() - global.time)

  // 构建依赖树
  let depTree = await buildDependTree(options)

  console.log(new Date().getTime() - global.time)

  // 校验模块
  depTree = rules.verify(depTree, options, this)

  // 统计概览信息
  const result = statistics(options, depTree, this)

  console.log(new Date().getTime() - global.time)
  // 触发构建完成事件
  event.emit('codevEnd', result)
}

// 扩展一些方法工具以备外部使用
Codev.prototype.addHook = event.on.bind(event)
Codev.prototype.addHooks = event.addList.bind(event)

Codev.prototype.Module = Module
Codev.prototype.findLoader = loaders.findLoader
Codev.prototype.utils = utils
Codev.prototype.examine = rules.examine

// 存放构建过程中解析出来的一些信息 比如node_modules路径 （准确度可能有误）
Codev.prototype.resolveData = {
  
}

// 扩展内部插件
!function (plugins, obj) {plugins.forEach(p => obj[p.name] = p)}(plugin.plugins, (Codev.plugin = {}))

