/**
* @file 加载ts|tsx类型模块
**/

const utils = require('../../utils/index.js')
const toAst = require('../jsLoader/babelTransformAst.js')

/**
 * 分析ts|tsx类型文件
 * @param  {object} module 模块
 * @param  {object} params 接受params.code选项 如果没有读取源
 * @return {object} params 生成ast并添加到params
 */
module.exports = function (module, params) {
  const source = params.code || module.getAttr('source').toString()
  const suffix = module.getAttr('suffix')

  // 获取babel配置
  let babelOpt
  try {
    babelOpt = suffix === '.ts' ? this.options.loaderOption.ts.babel : this.options.loaderOption.tsx.babel
    babelOpt.filename = module.getAttr('fileName') + module.getAttr('suffix')
  } catch (err) {
    utils.error('Missing babel in (options.loaderOption.ts.babel)')
    utils.exit()
  }

  params.ast = toAst(source, babelOpt, module.getAttr('filePath'))
  
  return params
}