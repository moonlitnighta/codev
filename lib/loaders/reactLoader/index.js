/**
* @file 加载react(js | jsx)类型模块
**/

const toAst = require('../jsLoader/babelTransformAst.js')
const utils = require('../../utils/index.js')

/**
 * 分析加载react(js | jsx)类型文件
 * @param  {object} module 模块
 * @param  {object} params 接受params.code选项 如果没有读取源
 * @return {object} params 生成ast并添加到params
 */
module.exports = function (module, params) {
  const source = params.code || module.getAttr('source').toString()
  
  // 获取babel配置
  let babelOpt
  try {
    babelOpt = this.options.loaderOption.react.babel
    babelOpt.filename = module.getAttr('fileName') + module.getAttr('suffix')
  } catch (err) {
    utils.error('Missing babel in (options.loaderOption.react.babel)')
  }

  params.ast = toAst(source, babelOpt, module.getAttr('filePath'))
  return params
}