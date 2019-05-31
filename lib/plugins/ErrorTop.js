/**
* @file 统计错误最多的文件和最多的错误类型
**/

const utils = require('../utils/index.js')

function ErrorTop(options) {
  if (!(this instanceof ErrorTop)) {
    return new ErrorTop(options)
  }

  // 关闭插件？
  if (options === false) {
    this.close = true
    return this
  }

  // 配置
  options = utils.merge({}, {
    // top 几？
    top: 5,
    // 如何定义模块名？值为函数 fn(modile.id)
    setModuleName: null,
    // 排除
    exclude: /node_modules/,
    // 'module' 错误最多的模块, 'type' 错误最多的类型,  'all' 两个都统计
    mode: 'all',
  }, options)

  this.init = function (plugin) {
    plugin.hook('statistics', function (result, depTree) {
      const moduleMode = options.mode === 'module' || options.mode === 'all'
      const typeMode = options.mode === 'type' || options.mode === 'all'
      const moduleError = []
      const typeError = {}
      const exclude = utils.wrapRegExp(options.exclude)
      const setModuleName = options.setModuleName

      const mks = depTree.moduleKeys
      for (let i = 0; i < mks.length; i ++) {
        const m = depTree.modules[mks[i]]

        // 排除  
        if (exclude && exclude(m.id)) {
          continue
        }

        // 获取模块的错误数量
        if (moduleMode) {
          m.warning.length && moduleError.push({
            label: setModuleName ? setModuleName(m.id) : m.fileName + m.suffix,
            value: m.warning.filter(w => w.type === 'error').length
          })
        }

        // 统计错误最多的类型
        if (typeMode && m.warning.length) {
          for (let n = 0; n < m.warning.length; n ++) {
            const e = m.warning[n]
            if (e.type === 'error') {
              typeError[e.message] = typeError[e.message] || 0
              typeError[e.message] ++
            }
          }
        }
      }

      // 将统计信息添加到result.overview
      if (moduleMode && moduleError.length) {
        const list = moduleError.sort((a, b) => b.value - a.value).slice(0, options.top)
        result.overview.unshift({
          label: 'most error module',
          childrens: list,
        })
      }

      if (typeMode && !utils.isNullObject(typeError)) {
        const arr = []
        for (let k in typeError) {
          arr.push({
            label: k,
            value: typeError[k]
          })
        }

        const list = arr.sort((a, b) => b.value - a.value).slice(0, options.top)
        result.overview.unshift({
          label: 'most error type',
          childrens: list,
        })
      }
    })
  }
}

module.exports = ErrorTop