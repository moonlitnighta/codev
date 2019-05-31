/**
* @file 加载css类型模块
**/

const parse = require('./parse.js')
const utils = require('../../utils/index.js')

/**
 * 分析css类型文件
 * @param  {object} module 模块tools
 * @param  {object} params 接受params.code选项 如果没有读取源
 * @return {object} params 转换为ast并添加到params
 */
module.exports = function (module, params) {
  const code = params.code || module.getAttr('source').toString()

  const parseRes = parse(code, module)
  params.ast = parseRes.ast
  module.addDepend(parseRes.depends)
  return params
}