/**
* @file 加载styl类型模块
**/

const stylus = require('stylus')
const utils = require('../../utils/index.js')

function transform(code, options) {
  return new Promise((resolve, reject) => {
    const styl = stylus(code, options)
    
    styl.render(function(err, css){
      err ? reject(err) : resolve(css)
    })
  })
}

/**
 * 分析加载styl类型文件
 * @param  {object} module 模块
 * @param  {object} params 接受params.code选项 如果没有读取源
 * @return {object} params 转换code并添加到params
 */
module.exports = async function (module, params) {
  const source = params.code || module.getAttr('source').toString()
  const options = {
    paths: [this.options.context],
    filename: module.getAttr('filePath')
  }
  return transform(source, options).then((code) => {
    params.code = code || ' '
    return params
  }, (e) => {
    utils.error(`Module loading error in ${module.getAttr('filePath')}`)
    utils.exit()
  })
}