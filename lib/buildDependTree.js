/**
* @file 构建模块依赖树
**/

const path = require('path')
const fs = require('fs')
const resolve = require('./resolve/index.js')
const findLoader = require('./loaders/index.js').findLoader
const utils = require('./utils/index.js')
const networkResource = require('./resolve/networkResource.js')
const Codev = require('./Codev.js')
const Tree = require('./core/Tree.js')
const event = require('./core/event.js')

/**
 * 运行匹配到的所有loader
 * @param  {array}  loaders  loaders
 * @param  {object} module   模块
 * @return {object}          module
 */
async function runLoader(loaders, module) {
  let params = {}
  for (let i = 0; i < loaders.length; i ++) {
    let par = await loaders[i].call(Codev.codev, module.tools, params)
    if (utils.isObject(par)) {
      params = par
    }
  }
  return module
}

/**
 * 排除某些文件
 * @param  {string} filePath 文件路径
 * @param  {object} options  构建对象
 * @return {boolean}         中靶？
 */
function exclude(filePath, options) {
  const excludes = Array.isArray(options.resolve.exclude) ? options.resolve.exclude : [options.resolve.exclude]
  if (!excludes.length) return false
  for (let i = 0; i < excludes.length; i ++) {
    if (
      (utils.isRegExp(excludes[i]) && excludes[i].test(filePath)) || 
      (typeof excludes[i] === 'function' && excludes[i](filePath)) ||
      (excludes[i] === filePath)
    ) {
      return true
    }
  }
}

/**
 * 根据路径查找解析并创建module
 * @param  {object} depTree      依赖树对象
 * @param  {object} options      构建对象
 * @param  {object} parentModule 父模块
 * @param  {string} filePath     模块路径
 * @return {object}              module
 */
async function loader(depTree , options , parentModule , filePath) {
  const parentPath = parentModule && parentModule.filePath || filePath
  const context = path.dirname(parentPath)

  // 查找并创建一个新模块
  const module = utils.isNetwork(filePath) || utils.isNetwork(parentPath) ? 
                 await networkResource(depTree, options, context, filePath) :
                 await resolve(options, context, filePath)

  // 根据exclude配置排除一些玩意
  if (exclude(module.filePath, options)) {
    return null
  }

  // 排除已经解析过的模块
  if (depTree.modules[module.id]) {
    parentModule && depTree.modules[module.id].addParentModule(parentModule)
    return depTree.modules[module.id]
  }

  // 模块添加到模块树
  depTree.addModule(module)

  // 在当前模块中添加依赖该模块的父模块
  parentModule && module.addParentModule(parentModule)

  // 触发模块创建事件
  event.emit('moduleCreate', module.tools)

  // 是否存在对应的loader
  const loaders = findLoader(module, options)

  // 没有loader警告 否则执行所有loader
  if (loaders) {
    const res = await runLoader(loaders, module)
  } else {
    utils.warning(`No loader in ${module.filePath}`)
  }

  // 模块解析完成
  event.emit('moduleLoaderComplete', module.tools)

  // 有依赖继续递归加载依赖
  if (module.depends.length) {
    for (let i = 0; i < module.depends.length; i ++) {
      const m = await loader(depTree, options, module, module.depends[i].module)
      if (m) {
        module.depends[i].module = m
      } else {
        module.depends.splice(i, 1)
        i --
      }
    }
  }

  // 模块包括子模块解析完毕
  event.emit('moduleEnd', module.tools)

  return module
}

/**
 * 从options.enter开始构建模块依赖树
 * @param  {object} options 构建对象
 * @return {object}         deptree        
 */
module.exports = async function (options) {
  const depTree = new Tree()
  const enter = Array.isArray(options.enter) ? options.enter : [options.enter]

  for (let i = 0; i < enter.length; i ++) {

    // 入口配置不是个绝对路径直接滚蛋
    if (!path.isAbsolute(enter[i])) {
      utils.error(`The configuration is illegal in ${enter[i]}`)
      utils.exit()
    }
    depTree.enter.push(await loader(depTree, options, null, enter[i]))
  }

  // 触发模块树构建完成钩子
  event.emit('dependTreeComplete', depTree)

  return depTree
}