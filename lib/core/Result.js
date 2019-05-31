/**
* @file 构建结果对象
**/

const utils = require('../utils/index.js')

function Result() {

  // 项目名称
  this.name = ''

  // 版本
  this.version = ''

  // 啥项目？
  this.description = ''

  // 模块数量 === moduleTree.total
  this.moduleCount = 0

  // 错误数
  this.errorCount = 0

  // 模块树
  this.moduleTree = null

  /*
   * 储存项目概览数据
   * 每项包含label和value和可选的childrens
   * value 可以是基础数据类型及数组
   * childrens目前只能有一级
   */
  // 
  // [
  //   {
  //     label: String,
  //     value: String | Number | String [],
  //     childrens: overview.item
  //   }
  // ]
  /* 关于module.info的统计 */
  // 如果info.value 是Number :
  // [
  //   label: info.label,
  //   value: 'info.value' sum
  // ]
  // 如果info.value 是Boolean :
  // [
  //   label: info.label,
  //   value: null,
  //   childrens: [
  //     {
  //       label: 'true',
  //       value: 'info.value === true' sum
  //     }, {
  //       label: 'false',
  //       value: 'info.value === false' sum
  //     }
  //   ]
  // ]
  // 如果info.value 是String :
  // [
  //   label: info.label,
  //   value: null,
  //   childrens: [
  //     {
  //       label: info[n].value,
  //       value: 'info[n].value' number sum,
  //     }
  //   ]
  // ]
  // 如果info.value 是String[] :
  // [
  //   label: info.label,
  //   value: info.value.length sum,
  // ]
  this.overview = []

  
}

Result.Overview = function (label, value) {
  const type = this.type = Object.prototype.toString.call(value)
  this.label = label

  if (type === '[object Number]' || type === '[object Array]') {
    this.value = 0
  }

  if (type === '[object String]') {
    this.childrens = []
    this._inquire = {}
  }

  if (type === '[object Boolean]') {
    const _true = {
      label: 'true',
      value: 0,
    }
    const _false = {
      label: 'false',
      value: 0,
    }
    this.childrens = [_true, _false]
    this._inquire = {
      'true': _true,
      'false': _false,
    }
  }
}

Result.Overview.prototype.add = function (v) {
  if (Object.prototype.toString.call(v) === this.type) {
    switch (this.type) {
      case '[object Number]': {
        this.value += v
        break;
      }
      case '[object Array]': {
        this.value += v.length
        break;
      }
      case '[object String]': {
        if (!this._inquire[v]) {
          this.childrens.push(this._inquire[v] = {
            label: v,
            value: 0,
          })
        }
        this._inquire[v].value ++
        break;
      }
      case '[object Boolean]': {
        v ? this._inquire['true'].value ++ : this._inquire['false'].value ++
        break;
      }
    }
  } else {
    utils.warning(`${this.label} Its value is ${this.type}, But what I received at the moment is ${Object.prototype.toString.call(v)}`)
  }
}

module.exports = Result