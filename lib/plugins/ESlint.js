/**
* @file 集成ESlint
**/

const utils = require('../utils/index.js')
const path = require('path')
const CLIEngine = require("eslint").CLIEngine

function ESlint(options) {
  if (!(this instanceof ESlint)) {
    return new ESlint(options)
  }

  // 关闭插件？
  if (options === false) {
    this.close = true
    return this
  }

  // 默认配置
  options = utils.merge({}, {
    // 对哪些文件进行lint
    test: /\.(js|ts|tsx)$/,
    // 过滤哪些文件
    exclude: /(node_modules)/,
    // 一般情况下如果项目使用了eslint则default：true即可使用正确的工作目录和.eslintrcjs文件
    default: false,
    // eslint配置文件目录
    eslintrcjs: null,
    // 默认过滤eslint severity = 1的警告
    excludeWarning: true,
    // 在codev中警告类型为error的应该包含eslint severity的哪些值？范围之外的都将定义为警告
    errorRange: '2 3',
    // new CLIEngine()的配置 具体查看eslint官网
    CLIEngineOptions: {
      useEslintrc: false,
    },
  }, options)

  this.init = function (plugin) {
    let cli = null

    if (!options.default) {
      let eslintrcjs = options.CLIEngineOptions.eslintrcjs

      // 没有配置eslintrcjs路径时默认使用enter配置来查找eslintrcjs
      if (!eslintrcjs) {
        eslintrcjs = utils.findModulePath(
          Array.isArray(this.options.enter) ? this.options.enter[0] : this.options.enter,
          './.eslintrc.js'
        )
      }

      // eslint 工作目录
      const cwd = eslintrcjs && path.dirname(eslintrcjs)

      // 如果没有配置eslint工作目录则使用.eslintrcjs文件所在位置作为工作目录
      options.CLIEngineOptions.cwd = options.CLIEngineOptions.cwd || cwd
      options.CLIEngineOptions.configFile = options.CLIEngineOptions.configFile || eslintrcjs

      // 项目不存在 .eslintrcjs时默认未启用eslit 退出插件
      if (!options.CLIEngineOptions.configFile) {
        return false
      }

      // 创建cli实例
      cli = new CLIEngine(options.CLIEngineOptions)
    } else {
      try {
        cli = new CLIEngine(options.CLIEngineOptions)
      } catch (err) {
        utils.warning('Eslint plugin initialization error, please close the plugin if your project does not use eslint')
      }
    }

    plugin.loader(options.test, function (module, params) {
      // 排除某些
      const exclude = utils.isRegExp(options.exclude) ? 
                      options.exclude.test.bind(options.exclude) : 
                      typeof options.exclude === 'function' ? options.exclude : null
      if (exclude && exclude(module.getAttr('filePath'))) return params

      // 检查文件
      const code = module.getAttr('source')
      const report = cli.executeOnText(code.toString(), module.getAttr('fileName') + module.getAttr('suffix'))

      // 是否过滤eslint警告
      const results = options.excludeWarning ? CLIEngine.getErrorResults(report.results) : report.results

      // 将错误信息添加到模块
      const errorRange = options.errorRange
      results.forEach((result) => {
        const megs = result.messages
        for (let i = 0; i < megs.length; i ++) {
          const k = megs[i].severity
          module.addWarning({
            type: errorRange.indexOf(k) > -1 ? 'error' : 'warning',
            message: megs[i].message,
          })
        }
      })
      
      return params
    })
  }
}

module.exports = ESlint