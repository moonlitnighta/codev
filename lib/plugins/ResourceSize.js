/**
* @file 计算静态资源的大小及是否超标
**/

const utils = require('../utils/index.js')

const unit = {
  'Byte': 1,
  'KB': 1000,
  'MB': 1000 * 1000,
}

function ResourceSize(options) {
  if (!(this instanceof ResourceSize)) {
    return new ResourceSize(options)
  }

  // 关闭插件？
  if (options === false) {
    this.close = true
    return this
  }

  const defaultOptions = {
    exclude: null,
    test: /\.(png|jpg|jpeg|svg|gif|eot|woff|ttf)$/,
    infoLabel: 'resource size',
    infoType: 'public',
    infoDescription: 'resource size',
    unit: 'KB',
    rule: {
      standard: 1024,
      message: 'Static resource is too large!',
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

      // 获取文件大小
      const scale = unit[options.unit] || 1000
      const size = module.getAttr('source').length / scale

      module.addInfo({
        value: size,
        label: options.infoLabel + ` (${options.unit || 'KB'})`,
        type: options.infoType,
        description: options.infoDescription,
      })

      // 计算资源是否超标
      if (options.rule) {
        const standard = options.rule.standard
        const warning = {
          type: options.rule.type || this.options.rulesOptions.defaultWarningType,
          message: options.rule.message,
        }
        if (typeof standard === 'function') {
          if (standard(module.getAttr('filePath'), module.getAttr('source'))) {
            module.addWarning(warning)
          }
        } else {
          if (size > standard) {
            module.addWarning(warning)
          }
        }
      }

      return params
    })
  }
}

module.exports = ResourceSize