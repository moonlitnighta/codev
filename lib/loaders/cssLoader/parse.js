/**
* @file 分析css类型文件依赖
**/
const postcss = require("postcss")
const utils = require('../../utils/index.js')
const Codev = require('../../Codev.js')
const event = require('../../core/event.js')

/**
* 过滤路径
* @param { string } url 路径
**/
function filterUrl(url){
  url = url.replace(/('|")/,'');
  return /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i.test(url);
}

/**
* 提取css属性url中的参数
* @param { string } code 解析对象
**/
function parseUrl(code){
  let rexg = /url\((.*?)\)/g;
  let strs = code.match(rexg);
  let res = [];

  if(strs){
    strs.forEach(function (item){
      rexg.lastIndex = 0;
      let url = rexg.exec(item)[1];
      url && !filterUrl(url) && res.push(url.replace(/'|"/g,''));
    })
  }

  return res;
}

/**
* 方法暴露
* @param { string } code   解析的代码
* @param { object } module 分析的模块
* @return{ array }         模块依赖
**/
module.exports = function (code, module){
  let depends = []
  let ast

  // 将源码转ast
  try {
    ast = postcss.parse(code)
  } catch (err) {
    utils.error(`Convert ast error ${err.message} in ${module.getAttr('filePath')}`)
  }

  // 提取外部样式 仅支持 @import
  ast.walkAtRules(/^import$/i, function(rule) {
    if(rule.name == 'import'){
      let path;
      try {
        path = rule.params.replace(/(url\(|\)|'|"|\s)/g,'');
      } catch (err){
        utils.error(`Unable to parse module path in ${rule.params} ${rule.source.start.line} line`)
        utils.exit()
      }
      
      depends.push({
        module:path,
        type:'Import'
      });
    }
  });

  // 提取其他引用资源
  ast.walkDecls(function (rule) {
    if(rule.value.indexOf('url') > -1){

      // 解析url中间的参数
      let urls = parseUrl(rule.value);

      urls.forEach(function (url){
        depends.push({
          module:url,
          type:'Url'
        });
      })
    }
    event.emit('enterAstNode', module, rule, null)
  });
  
  return {
    depends,
    ast
  }
}