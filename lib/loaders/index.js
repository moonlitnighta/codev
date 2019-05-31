/**
* @file 根据不同文件类型查找对于的loader
**/

const jsLoader = require('./jsLoader/index.js')
const tsLoader = require('./tsLoader/index.js')
const cssLoader = require('./cssLoader/index.js')
const vueLoader = require('./vueLoader/index.js')
const fileLoader = require('./fileLoader/index.js')
const htmlLoader = require('./htmlLoader/index.js')
const imageLoader = require('./imageLoader/index.js')
const reactLoader = require('./reactLoader/index.js')
const sassLoader = require('./sassLoader/index.js')
const lessLoader = require('./lessLoader/index.js')
const stylusLoader = require('./stylusLoader/index.js')
const jsonLoader = require('./jsonLoader/index.js')

// 内置loader 如果匹配到多个则按数组顺序执行
const internalLoaders = [
  {
    test:/\.js$/,
    loader: jsLoader,
  }, {
    test:/\.css$/,
    loader: cssLoader,
  }, {
    test:/\.html$/,
    loader: htmlLoader,
  }, {
    test:/\.(png|gif|jpg|jpeg)$/,
    loader: imageLoader,
  }, {
    test:/\.(ts|tsx)$/,
    loader: [tsLoader, jsLoader],
  }, {
    test:/\.vue$/,
    loader: vueLoader,
  }, {
    test:/\.styl$/,
    loader: [stylusLoader, cssLoader],
  }, {
    test:/\.scss$/,
    loader: [sassLoader, cssLoader],
  }, {
    test:/\.less$/,
    loader: [lessLoader, cssLoader],
  }, {
    test:/\.json$/,
    loader: [jsonLoader],
  }, {
    test:/\.jsx$/,
    loader: [reactLoader, jsLoader],
  }, {
    test:/\.(ttf|eot|woff|svg)$/,
    loader: fileLoader,
  }
]

// 通过plugin注册的loader保存在这里
const pluginLoader = []

// 缓存loader 省的同类型的文件也去查找一遍
const loaderCache = {}

/**
 * 查找对应的loader
 * @param  {object} module  模块
 * @param  {object} options 构建对象
 * @return {array}          loaders
 */
function findLoader(module, options) {
  const suffix = module.suffix

  // 缓存过直接返回
  if (loaderCache[suffix]) return loaderCache[suffix]

  const loader = (options.loaders || []).concat(pluginLoader)
  const res = []

  // 内置loaders中是否有对应的loader
  for (let i = 0; i < internalLoaders.length; i ++) {
    const reg = internalLoaders[i].test
    if (reg.test(suffix)) {
      const loaders = Array.isArray(internalLoaders[i].loader) ? internalLoaders[i].loader : [internalLoaders[i].loader]
      res.push.apply(res, loaders)      
    }
  }

  // 是否配置自定义loader
  for (let i = 0; i < loader.length; i ++) {
    const reg = loader[i].test
    const queue = loader[i].queue
    if (reg.test(suffix)) {
      const loaders = Array.isArray(loader[i].loader) ? loader[i].loader : [loader[i].loader]
      if (queue === 'after') {
        res.push.apply(res, loaders)
      } else {
        res.unshift.apply(res, loaders)
      }
    }
  }

  return res.length ? (loaderCache[suffix] = res) : false
}

module.exports = {
  internalLoaders: internalLoaders,
  findLoader: findLoader,
  pluginLoader: pluginLoader,
}

