#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const _package = require(path.resolve(__dirname, '../package.json'))
const program = require('commander')
const defaultConfig = require('../lib/config/defaultConfig.js')
const utils = require('../lib/utils/index.js')
const webpackMerge = require('webpack-merge')
const Codev = require('../lib/Codev.js')

const merge = webpackMerge(({
  customizeArray: function (a, b) { return b }
}))

// 构建对象
let options = {}
// codev执行所在目录绝对路径
options.codevPath = process.cwd()
let config = null
const args = []
const getValue = function (v){
  v && args.push(v)
  return v
}

program
  .version(_package.version, '-v, --version')
  .description('source visualization！')
  .option('-e, --enter <path>', 'enter file！(Will be parsed using the default configuration)', getValue)
  .option('-c, --config <path>', 'specify configuration file', getValue)
  .parse(process.argv)

if (args.length === 0) {
  program.outputHelp()
  utils.exit()
}

//------------------------------------------------------处理配置------------------------------------------------------//

// 如果存在配置文件就读取
if (program.config) {
  try {
    config = require(utils.absolutePath(options.codevPath, program.config))
  } catch (err) {
    utils.error(`Path error in ${program.config} \n ${err.message}`)
  }
}

// 没有指定配置文件则使用默认配置
config = config || merge({}, defaultConfig)
let enterPath = program.enter || config.enter

// 必须要有入口文件 或构建上下文目录
if (!enterPath) {
  utils.error(`Missing entry file or invalid path to entry file`)
  utils.exit()
}

// 入口
config.enter = enterPath

// 如果为指定上下文目录则默认取enter
// enter是数组目前先默认取文件夹最浅的
try {
  if (!config.context) {
    const enter = Array.isArray(config.enter) ? config.enter : [config.enter]
    const contexts = []
    enter.forEach(_path => contexts.push(path.dirname(_path).split('/').length))
    config.context = path.dirname(enter[contexts.indexOf(Math.min.apply(Math, contexts))])
  }
} catch (err) {
  utils.error(`Incorrect entry file configuration, Unable to parse the context directory from ${err.message}`)
  utils.exit()
}

// 将配置文件与默认配置merge
const cfg = merge({}, defaultConfig, config)
options = merge({}, cfg, options)
options.config = cfg

// 构建
const codev = new Codev(options)

