/**
* @file 对原始option（config）做一些解析
**/

const utils = require('./utils/index.js')
const defaultConfig = require('./config/defaultConfig.js')
const isRule = require('./rules/index.js').isRule
const merge = require('merge')
const plugins = require('./plugins/index.js').plugins

/**
 * 对原始option（config）做一些解析
 * @param  {object} options 构建对象
 * @return {object} options 构建对象
 */
module.exports = function (options) {
  const resolve = options.resolve

  // 解析别名配置
  if (utils.isObject(options.alias)) {
    try {
      const alias = {
        keys: [],
        alias: {},
      }
      for (let k in options.alias) {
        let precise = k.length > 1 ? /\$$/.test(k) : false
        let key = precise ? k.slice(0, -1) : k
        alias.keys.push(key)
        alias.alias[key] = {
          value: options.alias[k],
          precise: precise,
        }
      }
      options.alias = alias
    } catch (err) {
      utils.error(`Alias ​​parsing error in config.alias! \n ${err.message}`)
      options.alias = null
    }
  } else {
    options.alias = null
  }

  // 当自定义priorit中未找到时启动默认priorit查找
  if (Array.isArray(resolve.priority)) {
    const priority = resolve.priority
    const DefaultPriority = defaultConfig.resolve.priority
    for (let i = 0; i < DefaultPriority.length; i ++) {
      priority.indexOf(DefaultPriority[i]) === -1 && priority.push(DefaultPriority[i])
    } 
    resolve.priority = priority
  } else {
    resolve.priority = defaultConfig.resolve.priority
  }

  // loaders
  !Array.isArray(options.loaders) && (options.loaders = [])

  // event
  options.events = utils.isObject(options.events) ? options.events : {}

  // sass loader
  const sassOpt = options.loaderOption.sass
  if (!sassOpt.includePaths) {
    sassOpt.includePaths = []
    sassOpt.includePaths.push(options.context)
  }

  // less loader
  const lessOpt = options.loaderOption.less
  if (!lessOpt.paths) {
    lessOpt.paths = []
    lessOpt.paths.push(options.context)
  }

  // exclude
  const exclude = resolve.exclude
  if (Array.isArray(exclude)) {
    resolve.exclude = exclude.concat(defaultConfig.resolve.exclude)
  } else if (utils.isObject(exclude)) {
    if (exclude.useInternal) {
      resolve.exclude = exclude.list.concat(defaultConfig.resolve.exclude)
    } else {
      resolve.exclude = exclude.list
    }
    resolve.exclude = defaultConfig.resolve.exclude
  }

  // babel配置
  // 强行使用ast转换 不需要code
  const loaderOption = options.loaderOption
  if (loaderOption.js.babel) {
    loaderOption.js.babel.ast = true
    loaderOption.js.babel.code = false
  }

  if (loaderOption.ts.babel) {
    loaderOption.ts.babel.ast = true
    loaderOption.ts.babel.code = false
  }

  if (loaderOption.tsx.babel) {
    loaderOption.tsx.babel.ast = true
    loaderOption.tsx.babel.code = false
  }

  if (loaderOption.react.babel) {
    loaderOption.react.babel.ast = true
    loaderOption.react.babel.code = false
  }

  // plugin
  if (Array.isArray(options.plugins)) {
    for (let i = 0; i < plugins.length; i ++) {
      const intPlg = plugins[i]
      let isAdd = true

      for (let n = 0; n < options.plugins.length; n ++) {
        const plg = options.plugins[n]
        if (plg instanceof intPlg) {
          plg.close && options.plugins.splice(n, 1)
          isAdd = false
          break
        }
      }

      if (isAdd) {
        options.plugins.unshift(new intPlg())
      }
    }
  } else {
    utils.warning(`Configuration error, need array in options.plugins`)
  }

  // rules 不合法直接删除
  if (Array.isArray(options.rules)) {
    for (let i = 0; i < options.rules.length; i ++) {
      if (!isRule(options.rules[i])) {
        options.rules.splice(i, 1)
        i --
      }
    }
  } else {
    utils.warning(`Configuration error, need array in options.rules`)
    options.rules = []
  }
  
  // rulesOptions
  try {
    options.rulesOptions.defaultWarningType = options.rulesOptions.defaultWarningType || 'error'
  } catch (err) {
    utils.error(`Configuration error, in options.rulesOptions ${err.message}`)
    utils.exit()
  }

  return options
}