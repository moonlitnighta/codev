/**
* @file 分析js类型文件
**/
const toAst = require('./babelTransformAst.js')
const estraverse = require('estraverse')
const utils = require('../../utils/index.js')
const Codev = require('../../Codev.js')
const event = require('../../core/event.js')

const globalVariable = [
  'global',
  'process',
  '__filename',
  '__dirname',
  'Buffer',
  'setImmediate'
]

const spec = {
  'esm': parseImport,
  'commonjs': parseCommonjs,
}

/**
* common js 规范查找 处理 require( xxx ) || require( 表达式 );
* @param { object } node 当前语法书节点
* @param { object } parent node的父节点
**/
function parseCommonjs(node , parent){
  if( node.name == 'require' &&
    node.type == 'Identifier' &&  
    parent.type == 'CallExpression' && 
    parent.arguments && 
    parent.arguments[0].value ){

    return {
      range:parent.range,
      type:'Require',
      module:parent.arguments[0].value
    }
  }
}
/**
* es6 import 规范查找 处理 import
* @param { object } node 当前语法书节点
* @param { object } parent node的父节点
**/
function parseImport(node , parent){
  if(node.type == 'ImportDeclaration'){
    if (node.source) {
      return {
        range:node.range,
        type:'Import',
        module:node.source.value
      }
    }
  }

  if (node.type == 'ExportNamedDeclaration') {
    if (node.source) {
      return {
        range:node.source.range,
        type:'Import',
        module:node.source.value
      }
    }
  }

  if (node.type === 'Import' && parent.type === 'CallExpression') {
    return {
      range:parent.loc,
      type:'Import',
      module:parent.arguments[0].value
    }
  }
}
/**
* es6 import 规范查找 处理 export
* @param { object } node 当前语法节点
* @param { object } parent node的父节点
**/
function parseExport(node, parent){
  let specifiers = [];
  if(node.type == 'ExportNamedDeclaration'){

    // 处理 export { a } || export { a , b }
    if(node.specifiers && node.specifiers.length){
      node.specifiers.forEach((obj)=>{
        specifiers.push({
          exported:obj.exported.name,
          local:obj.local.name
        });
      });

      return {
        range:node.range,
        type:'Export',  
        exports:specifiers
      }
    } 

    //export 后面跟变量申明情况 export var a = value || export var a , b;
    else if(node.declaration && node.declaration.type == 'VariableDeclaration'){
      node.declaration.declarations.forEach((obj , i)=>{
        if(obj.type == 'VariableDeclarator'){

          //第一个变量的范围始终是 export语句开始 到 var x结束
          let range = i ? obj.id.range : [
            node.range[0],
            obj.id.range[1]
          ]
          specifiers.push({
            name:obj.id.name,
            range:range
          })
        }
      });

      return {
        range:node.range,
        type:'ExportVariable',
        exports:specifiers
      }
    }
  } else if(node.type == 'ExportDefaultDeclaration'){

    //默认导出
    return {
      range:[node.range[0] , node.declaration.range[0]],
      type:'Export',
      exports:[
        {
          exported:'default',
          local:''
        }
      ]
    }
  }
}

/**
* 方法暴露
* @param { string } source 分析的文件源码
* @param { object } module 分析的模块
* @param  {object}  resolve解析配置
* @return{ object }        依赖和ast树
**/
module.exports = function (source, module, resolve){
  const depends = []
  let ast

  // 如果源不是ast则转ast
  if (typeof source === 'string') {
    ast = toAst(source, {ast:true, code:false}, module.getAttr('filePath'))
  } else {
    ast = source
  }

  const importSpec = resolve.importSpec
  const spec_a = spec[importSpec[0]]
  const spec_b = spec[importSpec[1]]
  //遍历语法书
  estraverse.traverse(ast.program, {
    enter : function (node, parent){
      // 导入 require || import
      let dep = spec_a(node, parent) || spec_b(node, parent)

      if(dep){
        depends.push(dep)
      }
      event.emit('enterAstNode', module, node, parent)
    },
    leave : function (node, parent) {
      event.emit('leaveAstNode', module, node, parent)
    },
    fallback: 'iteration',
  })

  return {
    depends,
    ast,
  }
}