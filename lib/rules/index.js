/**
* @file 对模块进行校验
**/
const utils = require('../utils/index.js')

// 插件注册的规则保存在这里
const pluginRules = []

// 缓存同类型module rules
const ruleCache = {}

// 默认警告类型
let defalutWarningType = ''

// 最高级别警告类型
const mostDangerous = 'error'

// 支持的比较类型
const operators = {
  '<': true,
  '>': true,
  '=': true,
}

// 只有都是左右都是number类型才可使用
const numberOperator = {
  '<': true,
  '>': true,
}

/**
 * 对布尔类型的info比较
 * @param  {boolean} value 比较值
 * @param  {array}  infos  module信息
 * @return {object}        中靶的信息
 */
function booleanCompare(value, infos) {
  for (let i = 0; i < infos.length; i ++) {
    if (infos[i].value === value) {
      return infos[i]
    }
  }
}

/**
 * 对模块info利用正则比较
 * @param  {regExp} reg    比较值
 * @param  {array}  infos  module信息
 * @return {object}        中靶的信息
 */
function regExpCompare(reg, infos) {
  for (let i = 0; i < infos.length; i ++) {
    if (reg.test(infos.value)) {
      return infos[i]
    }
  }
}

/**
 * 对某条规则进行比较
 * @param  {string} rule  比较规则
 * @param  {array}  infos 模块信息
 * @return {object}       有任意一条信息中靶则返回该信息（中靶表示该条standard校验不通过）
 */
function compare(rule, infos) {
  rule = rule.replace(/(^\s*)/g, "")
  const operator = rule[0]

  // 如果规则中不存在运算符则使用默认运算 = 
  if (!operators[operator]) {
    operator = '='
    rule = '=' + rule
  }

  const value = rule.slice(1)
  const isNumber = !isNaN(Number(value))

  for (let i = 0; i < infos.length; i ++) {
    const info = infos[i]

    // 比较运算符有一方不是数字则警告
    if (numberOperator[operator] && (!isNumber || isNaN(Number(info.value)))) {
      utils.warning(`Note that the ${operator} comparison is used in strings and numbers.`)
    }

    switch (operator) {
      case '>': {
        if (info.value > value) {
          return info
        }
        break
      }
      case '<': {
        if (info.value < value) {
          return info
        }
        break
      }
      case '=': {
        if (info.value === value) {
          return info
        }
        break
      }
      default: {
        utils.error(`Rule operator error in ${rule}`)
      }
    }
  }
}

/**
 * 对模块运行匹配的rule
 * @param  {object} rule   规则
 * @param  {object} module 模块
 * @param  {object} cv     codev实例
 * @return {object}        可能返回警告信息
 */
function runRule(rule, module, cv) {
  const info = module.info
  let warning

  // standard 和 type 打成数组方便对号入座
  const standards = Array.isArray(rule.standard) ? rule.standard : [rule.standard]
  const types = Array.isArray(rule.type) ? rule.type : [rule.type]

  // 根据rule.label查找需要校验的信息
  let infos = []
  if (typeof rule.label === 'string') {
    if (info[rule.label]) {
      infos.push(info[rule.label])
    }
  } else if (utils.isRegExp(rule.label)) {
    for (let k in info) {
      rule.label.test(k) && infos.push(info[k])
    }
  } else {
    const keys = Object.keys(info)
    infos = keys.map(k => info[k])
  }

  // 执行standards
  // 警告类型默认为 error
  let result = ''
  for (let i = 0; i < standards.length; i ++) {
    const standard = standards[i]
    const standardType = Object.prototype.toString.call(standard)

    switch (standardType) {
      case '[object Number]': {
        compare(`>${standard}`, infos) && (result = types[i] || defalutWarningType)
        break
      }

      case '[object String]': {
        compare(standard, infos) && (result = types[i] || defalutWarningType)
        break
      }

      // 如果standard是函数可以返回布尔值或一个warning
      case '[object Function]': {
        const res = standard.call(cv, module, infos)
        if (utils.isObject(res)) {
          warning = res
          result = res.type
        } else {
          warning = null
          res && (result = types[i] || defalutWarningType)
        }
        break
      }

      case '[object Boolean]': {
        booleanCompare(standard, infos) && (result = types[i] || defalutWarningType)
        break
      }

      case '[object RegExp]': {
        regExpCompare(standard, infos) && (result = types[i] || defalutWarningType)
        break
      }
    }

    // 第一条直接error级别了后面也没必要查了
    if (result === mostDangerous) {
      break
    }
  }

  // 校验通过了吗？
  if (!warning && result) {
    warning = {
      type: result,
      massage: rule.message,
    }
  }

  return warning
}

/**
 * 根据模块类型查找rule
 * @param  {array}  rules  所有规则
 * @param  {string} suffix 模块类型
 * @return {array}         匹配的规则
 */
function findRule(rules, suffix) {
  if (ruleCache[suffix]) return ruleCache[suffix]

  const res = []

  for (let i = 0; i < rules.length; i ++) {
    if (rules[i].test.test(suffix)) {
      res.push(rules[i])
    }
  }
  return ruleCache[suffix] = res
}

/**
 * 检查一个rule是否合法
 * @param  {object}  rule 被检查的rule
 * @return {object}       rule
 */
function isRule(rule) {
  if (!rule.test) {
    rule.test = /\.*/
  }
  if (!rule.standard) {
    utils.warning(`Registration rule error`)
    return false
  }
  if (typeof rule.standard !== 'function' && !rule.message) {
    utils.warning(`Standard is not a function message and label is required`)
    return false
  }

  return rule
}

/**
 * 对模块进行各种校验
 * @param  {object} depTree 依赖树
 * @param  {object} cv   codev实例
 * @param  {object} options 构建对象
 */
function verify(depTree, options, cv) {
  // 获得默认警告级别 否则 'error'
  defalutWarningType = options.rulesOptions.defaultWarningType

  const rules = pluginRules.concat(options.rules)

  // 遍历所有模块，对不同模块使用不同rule校验
  for (let i = 0; i < depTree.moduleKeys.length; i ++) {
    const module = depTree.modules[depTree.moduleKeys[i]]

    // 查找rule
    const rs = findRule(rules, module.suffix)
    for (let i = 0; i < rs.length; i ++) {
      const warning = runRule(rs[i], module, cv)
      if (warning) {
        module.addWarning(warning)
      }
    }    
  }

  return depTree
}

module.exports = {
  verify,
  pluginRules,
  isRule,
  examine: runRule,
}
