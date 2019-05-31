/**
* @file 把js代码转ast 利用babel
**/

const utils = require('../../utils/index.js')
const babel = require('@babel/core')

/*

            js 代码统一利用babel转ast
            babel 生成的ast与标准的ESTree有些差异
            具体差异: https://babeljs.io/docs/en/babel-parser#output
            标准ESTree: https://github.com/estree/estree

 */

/**
 * 把js代码转ast 利用babel
 * @param  {string} source     源码
 * @param  {object} babelOpt   babel配置
 * @param  {string} message    出错了给个什么标示性的错误
 * @return {object}            ast
 */
module.exports = function (source, babelOpt, message) {
  try {
    // 默认module
    babelOpt.sourceType = babelOpt.sourceType || 'module'
    const ast = babel.parse(source, babelOpt)
    return ast
  } catch (err) {
    utils.error(`conversion ast has an error in ${message} \n ${err.message}`)
    utils.exit()
  }
}