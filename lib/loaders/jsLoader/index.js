/**
* @file 加载js类型模块
**/

const parse = require('./parse.js')
const utils = require('../../utils/index.js')
const toAst = require('./babelTransformAst.js')

/**
 * 分析js类型文件
 * @param  {object} module 模块
 * @param  {object} params 接受.ast或.code 选项如果没有则读取源
 * @return {object} params 生成ast并添加到params
 */
module.exports = function (module, params) {
  let ast = params.ast
  if (!ast) {
    // 将模块内容转字符串
    ast = params.code || module.getAttr('source').toString()

    // 要babel搞下？
    try {
      const babelOpt = this.options.loaderOption.js.babel
      if (babelOpt && utils.isObject(babelOpt)) {
        ast = toAst(ast, babelOpt, module.getAttr('filePath'))
      }
    } catch (err) {
      utils.error(err.message)
    }
  }

  // 分析模块依赖并将依赖添加到模块
  const parseRes = parse(ast, module)
  params.ast = parseRes.ast
  module.addDepend(parseRes.depends)
  return params
}