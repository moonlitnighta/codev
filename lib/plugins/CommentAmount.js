/**
* @file 统计代码注释行数及警告无注释的代码
**/

const utils = require('../utils/index.js')

function CommentAmount(options) {
  if (!(this instanceof CommentAmount)) {
    return new CommentAmount(options)
  }

  // 关闭插件？
  if (options === false) {
    this.close = true
    return this
  }

  const defaultOptions = {
    exclude: null,
    test: /\.(js|ts|tsx)$/,
    infoLabel: 'comment amount',
    infoType: 'public',
    infoDescription: 'comment amount',
    rule: {
      baseLine: 20,
      standard: 10,
      message: 'comment Too little!',
      type: 'error',
    }
  }
  options = utils.merge({}, defaultOptions, options)

  this.init = function (plugin) {
    plugin.loader({
      test: options.test,
      queue: 'after',
    }, function (module, params) {
      if (!params.ast) {
        this.utils.error(`lack params.ast, The plugin requires estree in CommentAmount plugin`)
        return params
      }

      // 排除
      if (options.exclude && options.exclude.test(module.getAttr('filePath'))) {
        return params
      }

      // 获取注释条数
      const commentAmount = params.ast.comments.length

      // 计算代码行数
      let line = utils.removeBlankLine(module.getAttr('source').toString().split('\n')).length

      module.addInfo({
        value: commentAmount,
        label: options.infoLabel,
        type: options.infoType,
        description: options.infoDescription,
      })

      if (options.rule && line > options.rule.baseLine) {
        const standard = options.rule.standard
        const warning = {
          type: options.rule.type || this.options.rulesOptions.defaultWarningType,
          message: options.rule.message,
        }
        if (typeof standard === 'function') {
          if (standard(module.getAttr('filePath'), params.ast.comments)) {
            module.addWarning(warning)
          }
        } else {
          if (line / commentAmount > standard) {
            module.addWarning(warning)
          }
        }
      }

      return params
    })  
  }
}

module.exports = CommentAmount