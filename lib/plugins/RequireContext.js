/**
* @file 处理require.context的依赖
**/

const utils = require('../utils/index.js')
const path = require('path')

function RequireContext(options) {
  if (!(this instanceof RequireContext)) {
    return new RequireContext(options)
  }

  // 关闭插件？
  if (options === false) {
    this.close = true
    return this
  }

  // 配置
  options = utils.merge({}, {
    
  }, options)

  this.init = function (plugin) {
    function match(list, module, reg, recursive) {
      const files = utils.readdir(list)
      const subdirectory = []
      for (let i = 0; i < files.length; i ++) {
        if (reg.test(files[i])) {
          module.addDepend({
            module: path.resolve(list, files[i])
          })
        } else {
          const p = path.resolve(list, files[i])
          recursive && utils.isList(p) && subdirectory.push(p)
        }
      }

      if (recursive && subdirectory.length) {
        for (let i = 0; i < subdirectory.length; i ++) {
          match(subdirectory[i], module, reg, recursive)
        }
      }
    }

    plugin.hook('enterAstNode', function (module, node, parent) {
      if (
        node.type === 'MemberExpression' &&
        node.object && node.object.name === 'require' &&
        node.property && node.property.name === 'context' &&
        parent.type === 'CallExpression' && parent.arguments.length === 3
      ) {
        const listPath = parent.arguments[0].value
        const subdirectory = parent.arguments[1].value
        const reg = new RegExp(parent.arguments[2].pattern)

        // 当前模块路径
        const context = path.dirname(module.getAttr('filePath'))

        const list = path.resolve(context, listPath)

        // 如果不是个目录直接退出
        if (!utils.isList(list)) return

        match(list, module, reg, subdirectory)
      }
    })
  }
}

module.exports = RequireContext