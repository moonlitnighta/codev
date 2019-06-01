/**
* @file 各种各样的小工具
**/

const path = require('path')
const fs = require('fs')
const webpackMerge = require('webpack-merge')
const merge = webpackMerge(({
  customizeArray: function (a, b) { return b }
}))
const colors = require('colors')
const base = ['[object String]', '[object Boolean]', '[object Number]', '[object Array]']

module.exports = {
  // 正则表达式
  isRegExp: function (v) {
    return Object.prototype.toString.call(v) === '[object RegExp]'
  },

  // 包装正则表达式
  wrapRegExp: function (v) {
    return this.isRegExp(v) ? 
           v.test.bind(v) :
           typeof v === 'function' ? 
           v : null
  },

  // 遍历目录查找某个文件
  findModulePath: function(context, fileName) {
    let eslintrc = null
    let tables = context.split('/')
    let _tables = tables.slice(0)
    let _context = context

    for(let i = tables.length; i --;){
      if(tables[i]){
        try {
          eslintrc = require(path.resolve(_context, fileName))
        } catch (err) {}
        if(eslintrc){
          return path.resolve(_context, fileName)
        } else {
          _tables.pop();
          _context = _tables.join('/');
        }
      }
    }
  },

  // 基础数据类型?
  isBase: function (v) {
    return base.indexOf(Object.prototype.toString.call(v)) > -1
  },

  // 除去module源码的空行
  removeBlankLine: function (lines, type) {
    type = type || {
      first: false,
      tail: true
    }
    let s = 0, e = lines.length
    type.first && this.forEach(lines, (str, i) => { if (str.replace(/\s/g,'') !== '') {s = i; return 'break';} })
    type.tail && this.forEach(lines, (str, i) => { if (str.replace(/\s/g,'') !== '') {e = i; return 'break';} }, true)
    return lines.slice(s, e + 1)
  },

  // forEach、为啥不用原生？ 为了 break 补充循环顺序功能
  forEach: function (arr, callback, type) {
    if (!type) {
      for (let i = 0; i < arr.length; i ++) {
        const v = callback(arr[i], i, arr)
        if (v === 'break') break;
      }
    } else {
      for (let i = arr.length; i --;) {
        const v = callback(arr[i], i, arr)
        if (v === 'break') break;
      }
    }
  },

  // 外网的资源？
  isNetwork: function (url) {
    return url.match(/^(https|http|\/\/)/)
  },

  // 是某个构造的实例？？
  isConstruct: function () {
    
  },

  // 是个字符串数组？
  isStringArr: function (arr) {
    for (let i = 0; i < arr.length; i ++) {
      if (typeof arr[i] !== 'string') return false
    }
    return true
  },

  // 读取目录文件
  readdir: function (_path, throwErr) {
    try {
      return fs.readdirSync(_path)
    } catch (err) {
      return null
    }
  },

  // 处理错误
  error: function (meg) {
    throw new Error('CodevError - ' + meg)
  },

  // 处理警告
  warning: function (meg) {
    console.warn(('Warning: ' + meg).yellow)
  },

  // 获取绝对路径
  absolutePath: function (absolute, _path) {
    try {
      return path.isAbsolute(_path) ? _path : path.resolve(absolute , _path)
    } catch (err){
      this.error('Path conversion failed (in utils.absolutePath)')
    }
  },

  // 终究是个错的
  isNot: function (v) {
    return v === null || v === undefined || v === false
  },

  // 终止应用
  exit: function () {
    process.exit()
  },

  // 外部资源路径检查
  isExternal: function (url) {
    return /^(http|https)/.test(url);
  },

  // 如果路径存在则判断是否为有效文件路径
  exists: function (filePath) {
    if (fs.existsSync(filePath)) {
      try {
        return {
          content: fs.readFileSync(filePath),
          url: filePath,
        }
      } catch (err) {
        return false
      }
    } else {
      return false
    }
  },

  // 是否为有效目录
  isList: function (_path, throwErr) {
    if (fs.existsSync(_path)) {
     try {
       const stats = fs.statSync(_path)
       return !stats.isFile()
     } catch (err) {
       return false
     }
    } else {
      return false
    }
  },

  // 是个对象类型？
  isObject: function (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
  },

  // 读取文件内容
  readFile: function (url) {
    return new Promise (function (resolve) {
      fs.readFile(url, function (err, data) {
        resolve(err ? false : data)
      })
    })
  },

  // 获取模块行数
  getLine: function (source) {
    const code = Buffer.isBuffer(source) ? source.toString() : source
    return code.split('\n').length
  },

  // 空对象
  isNullObject: function (obj) {
    return !Object.keys(obj).length
  },

  // merge
  merge: merge,

  // 更具不同参数长度重载函数
  addMethod: function (obj, name, fn) {
    const old = obj[name]
    obj[name] = function () {
      if (arguments.length === fn.length) {
        return fn.apply(this, arguments)
      } else if(typeof old === 'function') {
        return old.apply(this, arguments)
      }
    }
  }
}