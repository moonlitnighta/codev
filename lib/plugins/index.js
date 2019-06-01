/**
* @file 插件相关
**/
const utils = require('../utils/index.js')
const event = require('../core/event.js')
const pluginLoader = require('../loaders/index.js').pluginLoader
const pluginRules = require('../rules/index.js').pluginRules
const isRule = require('../rules/index.js').isRule
const merge = require('merge')
const CodeLine = require('./CodeLine.js')
const CommentAmount = require('./CommentAmount.js')
const ResourceSize = require('./ResourceSize.js')
const ESlint = require('./ESlint.js')
const ErrorTop = require('./ErrorTop.js')
const TechnicalSelection = require('./TechnicalSelection.js')
const RequireContext = require('./RequireContext.js')

// 内置plugin
const plugins = [
  CodeLine,
  CommentAmount,
  ResourceSize,
  ESlint,
  ErrorTop,
  TechnicalSelection,
  RequireContext,
]

const plugin = {
  hook: event.on.bind(event),
  loader: function () {
    let defOpt = {
      test: /\.*$/,
      queue: 'before',
    }
    if (arguments.length === 0) {
      utils.warning(`Missing loader and options`)
      return
    }
    if (arguments.length === 1 && typeof arguments[0] === 'function') {
      defOpt.loader = arguments[0]
      pluginLoader.push(defOpt)
      return
    }

    if ((utils.isRegExp(arguments[0]) || utils.isObject(arguments[0])) && typeof arguments[1] === 'function') {
      utils.isRegExp(arguments[0]) ? (defOpt.test = arguments[0]) : (defOpt = merge(true, {}, defOpt, arguments[0]))
      defOpt.loader = arguments[1]
      pluginLoader.push(defOpt)
    } else {
      (utils.error(`Parameter error in plugin.loader`), utils.exit())
    }
  },
  rule: function () {
    let rule = {}
    if (arguments.length === 0) {
      utils.warning(`Registration rule error`)
      return
    }

    if (arguments.length === 1) {
      if (typeof arguments[0] === 'function') {
        rule.test = /\.*/
        rule.standard = arguments[0]
      } else {
        rule = arguments[0]
      }
      
    }

    if ((utils.isRegExp(arguments[0]) || utils.isObject(arguments[0])) && typeof arguments[1] === 'function') {
      utils.isRegExp(arguments[0]) ? (rule.test = arguments[0]) : (rule = merge(true, {}, rule, arguments[0]))
      rule.standard = arguments[1]
    } else {
      (utils.error(`Parameter error in plugin.loader`), utils.exit())
    }

    isRule(rule) && pluginRules.push(rule)
  }
}

/**
 * 注册插件
 * @param  {object} plugins 插件列表
 * @param  {object} codev   codev实例
 */
function addPlugin (plugins, codev) {

  // 清除通过plugin注册的loader、rules （比如new了一次Codev后又来一次...）
  pluginLoader.splice(0)
  pluginRules.splice(0)

  for (let i = 0; i < plugins.length; i ++) {
    const plg = plugins[i]
    if (typeof plg.init === 'function') {
      plg.init.call(codev, plugin)
    } else {
      utils.error(`Plugin missing 'init' in ${plg.name || ''}`)
    }
  }
}

module.exports = {
  addPlugin: addPlugin,
  plugins: plugins,
}