/**
 * @file 爬取网络资源 如果有必要
 */
const Module = require('../core/Module.js')
const request = require('request')
const concat = require('concat-stream')
const mime = require('mime-types')
const utils = require('../utils/index.js')
const path = require('path')
const urlTools = require('url')

const config = {
  url: '',
  method: "GET",
  headers: {},
}

/**
 * 爬取网络资源 如果有必要
 * @param  {object} depTree  依赖树对象
 * @param  {object} options  构建对象
 * @param  {string} context  查找上下文
 * @param  {string} url      文件url
 * @return {object}          module
 */
module.exports = async function (depTree, options, context, url) {
  const cfg = utils.isObject(options.resolve.network) ? options.resolve.network : config

  // 有回调吗？
  if (typeof options.resolve.callback === 'function') {
    url = options.resolve.callback(context, url)
  } else {
    if (utils.isNetwork(url)) {
      url = url
    } else {
      const urlobj = path.join(context, url).split('/')
      urlobj[0] += '/'
      url = urlobj.join('/')
    }

    // 没有协议 （//xxx.xxx）
    if (!/^(https|http)/.test(url)) {
      url = (cfg.protocol || urlTools.parse(context).protocol || 'http:') + url
    }
  }

  const urlobj = urlTools.parse(url)
  const filePath = `${urlobj.protocol}//${urlobj.hostname}${urlobj.pathname}`

  // 模块是否加载过?
  if (depTree.modules[filePath]) {
    return depTree.modules[filePath]
  }

  // 创建模块
  const module = new Module(filePath)
  
  // 爬还是不爬？
  if (options.resolve.network) {
    const query = urlobj.query && urlobj.query.slice(-1) !== '&' ? urlobj.query + '&' : urlobj.query || ''
    urlobj.query = `${query}codevTime=${new Date().getTime()}`
    urlobj.search = `?${urlobj.query}`
    url = urlobj.format()
    return new Promise(function (resolve) {
      try {
        cfg.url = url
        cfg.headers['content-type'] = mime.contentType(module.suffix)
        let suffix = ''
        request(cfg, function (error, response){
          if (!error && response.statusCode == 200) {
            suffix = mime.extension(response.headers['content-type'])
            suffix = suffix ? '.' + suffix : ''
          }
        })
        .pipe(concat(function(buf){
          module.source = buf
          module.suffix = module.suffix || suffix
          resolve(module)
        }))
      } catch(err){
        utils.error(`Fetch module failed in ${url} \n Details: ${err.message}`)
        resolve(module)
      } 
    })
  }

  return module
}