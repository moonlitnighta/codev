/**
* @file 计算module代码行数插件
**/

const utils = require('../utils/index.js')


function CodeLine(options) {
  if (!(this instanceof CodeLine)) {
    return new CodeLine(options)
  }

  // 关闭插件？
  if (options === false) {
    this.close = true
    return this
  }

  const defaultOptions = {
    exclude: null,
    test: /\.(js|ts|tsx|css|styl|scss|less|vue)$/,
    infoLabel: 'code line',
    infoType: 'public',
    infoDescription: 'code line',
    // first tail | first | tail | all
    blankLine: 'tail',
    rule: {
      standard: 500,
      message: 'code line excess!',
      type: 'error',
    }
  }

  options = utils.merge({}, defaultOptions, options)

  this.init = function (plugin) {
    plugin.loader(options.test, function (module, params) {
      // 排除
      if (options.exclude && options.exclude.test(module.getAttr('filePath'))) {
        return params
      }

      // 计算代码行数
      const code = module.getAttr('source').toString()
      let line = code.split('\n')

      // 排除哪里的空行？
      if (options.blankLine === 'all') {
        line = line.filter(l => l.replace(/\s/g,'') !== '')
      } else {
        const blankLine = options.blankLine.split(' ')
        const first = blankLine.indexOf('first') > -1
        const tail = blankLine.indexOf('tail') > -1

        line = utils.removeBlankLine(line, {
          first,
          tail
        })
      }

      module.addInfo({
        value: line.length,
        label: options.infoLabel,
        type: options.infoType,
        description: options.infoDescription,
      })

      // 计算代码行数超标？
      if (options.rule) {
        const standard = options.rule.standard
        const warning = {
          type: options.rule.type || this.options.rulesOptions.defaultWarningType,
          message: options.rule.message,
        }
        if (typeof standard === 'function') {
          if (standard(module.getAttr('filePath'), line.length)) {
            module.addWarning(warning)
          }
        } else {
          if (line.length > standard) {
            module.addWarning(warning)
          }
        }
      }

      params.code = code
      return params
    })
  }
}

module.exports = CodeLine