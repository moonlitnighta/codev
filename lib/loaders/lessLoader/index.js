/**
* @file 加载less类型模块
**/

const less = require("less")
const utils = require('../../utils/index.js')

/**
* 调用less解析
* @param { object } options 解析对象
* @param { string } code    需要解析的源码
**/
function transformLess(options , code){
  return new Promise(function (resolve , reject){
    less.render(code , options ,function (e, output) {
      options
        if(e){
          resolve(code);
        } else {
          resolve(output.css)
        }
    });
  })
}

/**
 * 分析less类型文件
 * @param  {object} module 模块tools
 * @param  {object} params 接受params.code选项 如果没有读取源
 * @return {object} params 转换code并添加到params
 */
module.exports = async function (module, params) {
  const source = params.code || module.getAttr('source').toString()

  // 获得用户less的配置
  const options = this.options.loaderOption.less
  options.filename = module.getAttr('filePath')

  // 转css
  const code = await transformLess(options, source)
  params.code = code || ' '
  return params
}