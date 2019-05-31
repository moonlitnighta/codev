/**
* @file 加载sass类型模块
**/
const path = require('path')
const sass = require("node-sass")
const utils = require('../../utils/index.js')
const webpackMerge = require('webpack-merge')
const merge = webpackMerge(({
  customizeArray: function (a, b) { return b }
}))

/**
* 调用node-scss解析为css
* @param { object } options 解析对象
* @param { object } module 需要解析的模块
**/
function transformScss(options , module){
  return new Promise((resolve , reject)=>{
    sass.render(options, (err , result)=>{
      if(err){
        utils.error('Error:' + module.getAttr('filePath') + err.formatted + '\n' + err.message)
        reject(code)
      } else {
        resolve(result.css.toString())
      }
    });
  })
}
/**
 * 分析sass类型文件
 * @param  {object} module 模块tools
 * @param  {object} params 接受params.code选项 如果没有读取源
 * @return {object} params 转换code并添加到params
 */
module.exports = async function (module, params) {
  const source = params.code || module.getAttr('source').toString()

  // 获得用户sass的配置
  const options = merge({}, this.options.loaderOption.sass)
  options.data = source
  options.includePaths.push(path.dirname(module.getAttr('filePath')))

  //转css
  const code = await transformScss(options, module)
  params.code = code || ' '
  return params
}