/**
* @file 相当于技术栈的统计吧，统计第三方包的引入次数排行
**/

const utils = require('../utils/index.js')

// 这是一组关键词
// 如果某包在其中出现过，不管多少次，均列为top里
const pivotal = [
  'vue',
  'jquery',
  'angular',
  'react',
  'backbone',
  'ember',
  'knockout'
]

function TechnicalSelection(options) {
  if (!(this instanceof TechnicalSelection)) {
    return new TechnicalSelection(options)
  }

  // 关闭插件？
  if (options === false) {
    this.close = true
    return this
  }

  // 配置
  options = utils.merge({}, {
    // 取top 几？
    top: 8,
    // 如何定义module是个第三方包？
    packPath: /node_modules/,
    // 排除一些玩意
    exclude: null,
  }, options)

  this.init = function (plugin) {
    plugin.hook('statistics', function (result, depTree) {
      const exclude = utils.wrapRegExp(options.exclude)
      const packPath = options.packPath
      const list = {}
      const suffixList = {}
      let top = options.top

      // 统计各个三方包的引入次数
      depTree.enterEach(function (module) {
        if (packPath.test(module.filePath)) {
          const pack = module.filePath.split(packPath).pop() || ''
          const packName = pack.split('/').filter(n => !!n)[0]
          if (packName) {
            list[packName] = list[packName] || 0
            list[packName] ++
          }

          return true
        } else {
          suffixList[module.suffix] = suffixList[module.suffix] || 0
          suffixList[module.suffix] ++
        }

        return false
      }, exclude)

      if (!utils.isNullObject(list)) {
        const overview = {
          label: 'frame library',
          value: [],
        }
        const arr = []
        for (let k in list) {
          arr.push({
            label: k,
            value: list[k]
          })
        }

        // 检索关键词
        for (let i = 0; i < arr.length; i ++) {
          if (pivotal.indexOf(arr[i].label) > -1) {
            overview.value.push(arr[i].label)
            arr.splice(i, 1)
            i --;
            top --;
          }
        }

        // 添加top列表到overview
        const topList = arr.sort((a, b) => b.value - a.value).slice(0, top)
        for (let i = 0; i < topList.length; i ++) {
          overview.value.push(topList[i].label)
        }

        result.overview.unshift(overview)
      }

      if (!utils.isNullObject(suffixList)) {
        const overview = {
          label: 'skill',
          value: [],
        }

        const arr = []
        for (let k in suffixList) {
          arr.push({
            label: k,
            value: suffixList[k]
          })
        }
        const topList = arr.sort((a, b) => b.value - a.value).slice(0, options.top)
        for (let i = 0; i < topList.length; i ++) {
          overview.value.push(topList[i].label)
        }

        result.overview.unshift(overview)
      }
    })
  }
}

module.exports = TechnicalSelection