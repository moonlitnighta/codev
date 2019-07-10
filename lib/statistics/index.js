/**
* @file 统计构建信息
**/

const Result = require('../core/Result.js')
const utils = require('../utils/index.js')
const Tree = require('../core/Tree.js')
const event = require('../core/event.js')
const path = require('path')

const isNodeModules = /node_modules/

/**
 * 统计项目基础信息
 * @param  {object} result  构建结果对象
 * @param  {object} options 构建对象
 * @return {object}         result
 */
function projectBsseInfo(result, options) {
  const packagePath = utils.findModulePath(
    Array.isArray(options.enter) ? options.enter[0] : options.enter,
    './package.json'
  )
  if (packagePath) {
    const pack = require(packagePath)
    result.name = pack.name
    result.version = pack.version
    result.description = pack.description
  }

  result.moduleCount = result.moduleTree.total
}

/**
 * 从options.enter开始统计项目模块树
 * @param  {object} depTree 依赖树
 * @param  {object} options 构建对象
 * @return {object}         moduleTree
 */
function moduleTree(depTree, options, excludeExternalPack) {
  const tree = new Tree()

  depTree.enterEach(function (m, p) {
    let module = tree.addModule({
      id: m.id,
      filePath: m.filePath,
      fileName: m.fileName,
      suffix: m.suffix,
      depends: [],
      origin: m.origin,
      info: m.info,
      warning: m.warning
    })

    // 获取该模块所在目录的目录名称
    const po = path.parse(module.filePath)
    if (po.dir) {
      module.listName = po.dir.split('/').pop()
    } 

    // 第三方包将获取包名
    if (po.dir && isNodeModules.test(module.filePath)) {
      const lists = po.dir.split('/')
      const i = lists.indexOf('node_modules')
      for (let n = lists.length; n --;) {
        let ph = lists.slice(0, n + 1).join('/')
        try {
          const pack = require(path.resolve(ph, './package.json'))
          if (pack) {
            module.origin = 'package'
            module.packName = pack.name
          }
        } catch (err) {}
        if (n <= i) {
          break;
        }
      }      
    }

    if (!p) {
      tree.enter.push(module)
    } else {
      tree.modules[p.id].depends.push(module.id)
    }

    // 如果module属于第三方包并且excludeExternalPack需要过滤
    if (excludeExternalPack && excludeExternalPack.test(m.filePath)) {
      return module
    }
  })

  return tree
}

/**
 * 收集info.type === 'public' 的模块信息 
 * @param  {object} result    构建结果对象
 * @param  {object} options  构建对象
 * @param  {object} depTree  依赖树
 */
function pickPublicInfo(result, depTree, options) {
  const overview = result.overview
  const cache = {}
  const list = {}
  const excludeInfo = utils.wrapRegExp(options.statistics.excludeInfo)
  const excludeError = utils.wrapRegExp(options.statistics.excludeError)

  const mks = depTree.moduleKeys
  for (let i = 0; i < mks.length; i ++) {
    const m = depTree.modules[mks[i]]

    // 触发统计模块信息遍历模块事件
    event.emit('statisticsModule', m)

    // 采集模块信息
    // 排除？
    !(excludeInfo && excludeInfo(m.filePath)) && pickInfo(m)

    // 采集模块错误信息
    // 排除？
    !(excludeError && excludeError(m.filePath)) && pickError(m)
  }

  // 采集单个模块信息
  function pickInfo(m) {
    const infos = m.info
    const labels = Object.keys(infos)
    for (let n = 0; n < labels.length; n ++) {
      const key = labels[n]
      const info = infos[key]
     
      // 收集吗？
      if (info.type === 'public') {
        if (!list[key]) {
          list[key] = new Result.Overview(key, info.value)
        }
        list[key].add(info.value)
      }
    }
  }

  // 采集单个模块的错误信息
  function pickError(m) {
    for (let i = 0; i < m.warning.length; i ++) {
      const w = m.warning[i]
      if (w.type === 'error') {
        result.errorCount ++
      }
    }
  }

  // 添加结果
  for (let k in list) {
    overview.push(list[k])
  }
}

/**
 * 统计构建信息
 * @param  {object} options 构建对象
 * @param  {object} depTree 依赖树
 * @param  {object} cv      codev实例
 * @return {object}         [统计信息]
 */
module.exports = function (options, depTree, cv) {
  const result = new Result()

  // 统计项目模块树
  result.moduleTree = moduleTree(depTree, options, options.moduleTree.excludeExternalPack)

  // 统计info.type === 'public' 的模块信息
  // 统计warning相关信息
  pickPublicInfo(result, depTree, options)

  // 项目基础信息
  projectBsseInfo(result, options)

  // 触发统计模块信息完成事件
  event.emit('statistics', result, depTree)

  return result
}