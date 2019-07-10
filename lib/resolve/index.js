/**
* @file 查找文件
**/

const path = require('path')
const utils = require('../utils/index.js')
const Module = require('../core/Module.js')
const fs = require('fs')

const isNodeModules = /node_modules/
// 缓存node_modules路径
let nodeModulesPath = ''
const pathCache = {}

function getNodeModulesPath(_path) {
  return _path.replace(/node_modules.*$/, '') + 'node_modules'
}

/**
 * 有些module会分为多个平台，比如'xxx.js', 可能(xxx.browser.js、xxx.module.js) 同时存在, 此时依照options.resolve.mainFields顺序查找
 * @param  {string} filePath   module路径
 * @param  {array}  mainFields 平台
 * @return {object}            模块有效路径
 */
function findPlatformName(filePath, mainFields) {
  const pathObj = path.parse(filePath)
  const list = utils.readdir(pathObj.dir)
  if (list && list.length) {
    const str = '/' + list.join('/') + '/'
    const fileName = pathObj.name
    
    for (let i = 0; i < mainFields.length; i ++) {
      const platform = mainFields[i]
      const match = new RegExp(`/${fileName}(-|\.|_)${platform}${pathObj.ext}/`).exec(str)
      if (match) {
        return utils.exists(path.resolve(pathObj.dir, fileName + match[1] + platform + pathObj.ext))
      }
    }
  } else {
    return 'no-file'
  }
}

/**
 * 判断引入的文件是否为第三方包并且为package.json browser字段中
 * @param  {string} packagePath package路径
 * @param  {string} _path       导入的模块路径
 * @return {object}             文件信息对象
 */
function nodeModulesFind(packagePath, _path) {
  if (!packagePath) return false

  const context = path.dirname(packagePath)
  let pack = null
  try {
    pack = require(packagePath)
    if (pack) {
      // browser存在并且为对象，则判断加载的文件是否在browser中
      if (utils.isObject(pack.browser)) {
        for (let k in pack.browser) {
          if (path.resolve(context, k) === path.resolve(context, _path)) {
            return utils.exists(path.resolve(context, pack.browser[k]))
          }
        }
      }
    }
  } catch (err) {
    return false
  }
}

/**
 * 向上遍历文件夹查找node_modules 目录
 * @param  {object} resolve  解析配置
 * @param  {string} filePath 文件路径
 * @param  {string} context  查找上下文
 * @return {string}          文件有效路径
 */
function findPackFile(resolve, context, moduleName){
  let filePath = false;

  // 利用缓存node_modules目录查找一次
  if (nodeModulesPath) {
    filePath = findPackage(resolve, path.resolve(nodeModulesPath, moduleName, 'package.json'))
    if (filePath) return filePath
  }

  //将context分割成单独目录循环查找
  let tables = context.split('/')
  let _tables = tables.slice(0)
  let _context = context
  let packagePath = path.join('node_modules', moduleName, 'package.json')

  for(let i = tables.length; i --;){
    if(tables[i]){
      filePath = findPackage(resolve, path.resolve(_context, packagePath))
      if(filePath){
        // 缓存node_modules目录
        nodeModulesPath = getNodeModulesPath(path.resolve(_context, './node_modules'))
        return filePath
      } else {
        _tables.pop();
        _context = _tables.join('/');
      }
    }
  }

  return filePath
}

/**
 * 补全文件后缀在当前目录中查找匹配到的类型文件
 * @param  {array} extensions 类型数组
 * @param  {string} context   查找的目录
 * @return {object}           找到的文件信息
 */
function patchSuffixFind(extensions, context) {
  let filePath
  for (let i = 0; i < extensions.length; i ++) {
    filePath = utils.exists(context + extensions[i])
    if (filePath) { return filePath }
  }
}

/**
 * 根据packagePath查找依赖文件
 * @param  {object} resolve     解析配置
 * @param  {string} packagePath node_modules下某包的路径
 * @return {string}             文件有效路径
 */
function findPackage(resolve, packagePath) {
  let pack = null
  let filePath
  try {
    pack = require(packagePath)
    if (pack) {
      for (let i = 0; i < resolve.mainFields.length; i ++) {
        filePath = pack[resolve.mainFields[i]]
        if (filePath) {
          // 如果是个对象跳过
          if (utils.isObject(filePath)) {
            continue
          }

          const suffix = path.extname(filePath)
          const context = path.resolve(path.dirname(packagePath), filePath)

          // 是个目录还是文件
          const isList = utils.isList(context)
          
          if (!isList) {
            // 有些大神连后缀都不写...
            if (suffix) {
              const file = utils.exists(context)
              if (file) return file

              // 后缀还是个假的？ xxx.module === xxx.module.js 
              return againstFind(path.dirname(packagePath), filePath , resolve)
            } else {
              return againstFind(path.dirname(packagePath), filePath , resolve)
            }
          } else {
            return againstFind(path.dirname(packagePath), filePath , resolve)
          }
        }
      }

      // 找到了模块的package.json 但是却没找到main、module、browser... 所以再努力一次 直接在模块下查找 index
      // 补全路径在当前文件夹下查找
      const context = path.resolve(path.dirname(packagePath), 'index')
      const extensions = resolve.priority
      return patchSuffixFind(extensions, context)
    }
  } catch (err) {
    return false
  }
}

/**
 * 在当前文件夹下查找
 * @param  {object} resolve  解析配置
 * @param  {string} filePath 文件路径
 * @param  {string} context  查找上下文
 * @return {string}          文件有效路径
 */
function contextFind(resolve, context, filePath) {
  let _path = ''
  // 如果指定node_modules路径则优先查找
  if (resolve.modulesPath) {
    _path = findPackage(resolve, `${resolve.modulesPath}/${filePath}/package.json`)
    if (_path) { return _path }
  }

  // 补全路径在当前文件夹下查找
  const extensions = resolve.priority
  for (let i = 0; i < extensions.length; i ++) {
    _path = utils.exists(path.resolve(context , filePath + extensions[i]))
    if (_path) { return _path }
  }
  
  return false
}

/**
 * 解析别名
 * @param  {object} alias    config.alias
 * @param  {string} filePath 导入的模块路径
 * @return {string}          filePath
 */
function resolveAlias(alias, filePath) {
  if (alias && alias.keys.length) {
    let ph = filePath
    const pathArr = ph.split('/')
    alias.keys.forEach(function (k) {
      if (pathArr.indexOf(k) > -1) {
        const ali = alias.alias[k]
        if (ali.precise) {
          ph = ph === k ? ali.value : ph
        } else {
          ph = ph.replace(k, ali.value)
        }
      }
    })
    return ph
  }

  return filePath
}

/**
* 根据普通路径查找文件
* @param { string } context 查找上下文
* @param { string } filePath 当前查找的文件
* @param  {object} resolve  解析配置
* @return {object}          文件信息
**/
function againstFind(context , filePath , resolve){
  let _path
  let dir = path.extname(filePath)

  // 如果有后缀则尝试直接使用当前上下文目录查找一次
  if (dir) {
    _path = utils.exists(path.resolve(context , filePath))
    if (_path) return _path
  }

  // 是否为 'a/b/c/' = 'a/b/c/index.js' 模式
  const logogram = filePath.slice(-1) == '/'
  // 是个绝对路径？
  const isAbsolute = path.isAbsolute(filePath)
  // './xxx/xxx/xx.js' 路径是'./'开头?
  const relatively = /^(\.\/)/.test(filePath)
  // 获取模块后缀
  const suffix = logogram ? '' : dir
  // 统一除去文件后缀
  const fp = filePath.replace(suffix, '')
  // 判断是 'a/b' 还是 'a/b/'
  const fileName = logogram ? ['index'] : suffix ? [''] : ['', '/index']
  // 文件后面还有参数？
  const fileType = suffix.indexOf('?') > -1 ? suffix.split('?')[0] : suffix
  // 如果文件没有后缀那么将根据resolve.priority循环查找
  const extensions = fileType ? [fileType] : resolve.priority.concat([''])

  // 如果文件来自node_modules那么将js置前查找
  if ((isNodeModules.test(context) || isNodeModules.test(filePath)) && !suffix) {
    extensions.splice(extensions.indexOf('.js'), 1)
    extensions.unshift('.js')
  }

  const modulesPath = resolve.modulesPath
  let tables = context.split('/')
  let _tables = tables.slice(0)
  let _context = context

  // 绝对路径就不走下面for的流程了, 没必要....
  if (isAbsolute) {
    for (let i = 0; i < extensions.length; i ++) {
      for (let l = 0; l < fileName.length; l ++) {
        _path = utils.exists(fp + fileName[l] + extensions[i])
        if (_path) return _path
      }
      
    }
    return false
  }

  for(let i = tables.length; i --;){
    for (let n = 0; n < extensions.length; n ++){
      for (let l = 0; l < fileName.length; l ++) {
        const url = fp + fileName[l] + extensions[n]
        const p = path.resolve(_context , url)
        _path = findPlatformName(p, resolve.mainFields)

        //----------------------------------------------------------------------------------------------------
        
        // 补全路径在项目文件下查找一次
        if (!_path) {
          _path = utils.exists(p)
          // 'adsads.asd.js'这样???????
          if (!_path && suffix) {
            _path = patchSuffixFind(resolve.priority, p)
          }
        } else if (_path === 'no-file') {
          _path = null
        }

        //----------------------------------------------------------------------------------------------------

        // 如果没找到则在node_modules中查找package.json 的 browser字段(可能是引入某个包中某个path 如： vue/dist/vue.js)
        if (!_path && !relatively) {
          const strArr = url.split('/')
          let packName = strArr.shift()
          let fn = strArr.join('/')
          if (packName && fn) {
            packName += '/package.json'
            _path = nodeModulesFind(modulesPath ? path.resolve(modulesPath , packName) : '', fn) ||
                    nodeModulesFind(path.resolve(nodeModulesPath ,packName), fn) ||
                    nodeModulesFind(path.resolve(_context , 'node_modules', packName), fn)
          }

          // 模块是在node_modules中查找到的、坑定要缓存node_modules的路径了
          if (_path && _path.url) {
            nodeModulesPath = getNodeModulesPath(_path.url)
          }
        }

        //----------------------------------------------------------------------------------------------------

        // 如果还没找到则补全路径在当前目录中或配置的modulesPath中查找node_modules
        // 直接在某个包中查找path （比如 vue/dist/vue.js 并且vue包没有定义browser字段 将直接当做path查找）
        if (!_path && !relatively) {
          _path = utils.exists(modulesPath ? path.resolve(modulesPath , url) : '') ||
                  utils.exists(path.resolve(nodeModulesPath, url)) ||
                  utils.exists(path.resolve(_context , 'node_modules/' + url))

          // 模块是在node_modules中查找到的、坑定要缓存node_modules的路径了
          if (_path && _path.url) {
            nodeModulesPath = getNodeModulesPath(_path.url)
          }
        }

        //----------------------------------------------------------------------------------------------------

        // 找到了欧耶!!!
        if (_path) {
          _path.url = _path.url.replace(fileType , suffix)
          return _path
        }
      }  
    }
      
    _tables.pop();
    _context = _tables.join('/');
  }

  return false;
}  

/**
 * 查找文件
 * @param  {object} options  解析对象
 * @param  {string} context  查找文件的上下文
 * @param  {string} filePath 文件路径
 * @return {object}          module  
 */
module.exports = function (options, context, filePath){
  const importName = filePath
  const resolve = options.resolve
  let url = null, file = null

  // 是在缓存
  if (pathCache[importName]) {
    const m = pathCache[importName][context]
    if (m) return m
  }
  
  // 处理别名
  filePath = resolveAlias(options.alias, filePath)

  // 有回调吗？
  url = typeof resolve.callback === 'function' && resolve.callback(context, filePath)
  
  if (!url) {
    // 是普通路径还是某个包名？不同情况启用不同查找方式
    if(filePath.indexOf('/') > -1 || path.extname(filePath)){
      file = againstFind(context , filePath , resolve)

      // 难道是'xxx/'或'xxx.xx'并且是引入第三方包 ？？
      if (!file) {
        file = findPackFile(resolve , context , filePath) 
      }
    } else {
      file = contextFind(resolve, context, filePath) || findPackFile(resolve , context , filePath)
    }
  } else {
    file = utils.exists(url)
  }

  // 找不到模块直接退出程序
  if (!file) {
    utils.error(`Module not found in ${filePath} - ${context}`)
    utils.exit()
  }

  url = file.url
  
  // 模块存在则尝试读取module内容并创建一个module
  const suffix = path.extname(url)
  const fileType = suffix.indexOf('?') > -1 ? suffix.split('?')[0] : suffix
  const uri = url.replace(suffix, fileType)
  const source = file.content

  // 无法读取模块内容直接退出程序
  if (!source) {
    utils.error(`Unable to read module content in ${url}`)
    utils.exit()
  }

  // 找到创建模块并返回
  const module = new Module(uri, source)

  pathCache[importName] = pathCache[importName] || {}
  pathCache[importName][context] = module

  return module
}