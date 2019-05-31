/**
* @file 事件中心
**/

const events = require('events')
const Codev = require('../Codev.js')
const utils = require('../utils/index.js')

const eventEmitter = new events.EventEmitter()

// 改写事件绑定函数
eventEmitter.addListener = eventEmitter.on = (function (addListener) {
  return function (event, fn) {
    if (!event || !fn) {
      utils.error('Hook registration error, parameter error')
      return
    }
    const fns = Array.isArray(fn) ? fn : [fn]
    for (let i = 0; i < fns.length; i ++) {
      typeof fns[i] === 'function' && addListener.call(this, event, fns[i].bind(Codev.codev))
    }
  }
})(eventEmitter.addListener)

eventEmitter.addList = function (list) {
  if (utils.isObject(list)) {
    for (let k in list) {
      this.addListener(k, list[k])
    }
  } else {
    utils.error('Parameter error, Need object type ! in addList')
  }
}

utils.addMethod(eventEmitter, 'removeHook', function () {
  this.removeAllListeners()
})
utils.addMethod(eventEmitter, 'removeHook', function (events) {
  this.removeAllListeners(events)
})
utils.addMethod(eventEmitter, 'removeHook', function (event, fn) {
  this.removeListener(event, fn)
})


module.exports = eventEmitter