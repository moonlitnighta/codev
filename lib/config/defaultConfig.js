/**
* @file 默认配置文件 （直接与用户配置文件合并）
**/
module.exports = {

  // 构建上下文目录
  // 如果为指定上下文目录则默认取enter
  // enter是数组目前先默认取文件夹最浅的
  context: '',

  // 入口文件 （绝对路径）可以数组 （多页面）
  enter: null,

  // 皮肤配置 一些颜色
  colors: {

    // 入口文件颜色
    enter: '#06ff00',

    // 普通文件颜色 实际颜色将在 ordinary - warning之间根据情况取色（一般是除第三方库外项目中自己的业务文件）
    ordinary: '#ffffff',

    // 警告文件颜色 实际颜色将在 ordinary - warning之间根据情况取色
    warning: '#ff0000',

    // 第三方库文件颜色 （一般指node_modules）
    library: '#006cff',
  },

  // 文件解析配置 （文件查找及解析规则）
  // 这里的配置直接影响result的各项结果
  resolve: {

    // 默认的文件查找优先级
    priority: ['.js', '.css', '.html', '.vue', '.jsx', '.scss', '.less', '.png', '.jpg', '.jpeg', '.styl', '.ts', '.tsx', '.gif', '.svg', '.json', '.ttf', '.eot', '.woff'],

    // 过滤哪些文件（完全忽略）
    // 可以是数组或是对象 数组的话会concat(内部exclude) 如果对象useInternal值表示是否和内置的exclude规则合并使用
    exclude: [],
    // exclude: {
    //   list: [/\.DS_Store/, /\.md$/],
    //   useInternal: false
    // },

    // 和webpack一样一样儿的意思
    alias: null,

    // 和webpack一样一样儿的意思
    mainFields: ["browser", "module", "main"],

    // 可以直接指定 node_modules 的路径 当查找第三方模块时优先此路径查找
    modulesPath: null,

    // 解析一个模块之前会调用 返回值为模块有效路径
    callback: null,

    // 网络资源模块还解析吗？如果为false则仅仅创建模块关系 否则将模块爬下来解析（耗时）
    network: true,

    // 依赖规范 
    // 目前仅支持es module 、commonjs
    // 该配置将会影响查找的先后循序
    importSpec: ['esm', 'commonjs'],
  },

  // loader
  // 
  loaders: [
    // {
    //   test: /\.js$/,

    //   // 返回值为infos: [{description: 'xxx', value: xxx}...] 可以异步或同步
    //   loader: function (module) {

    //   },
    //   // 在内置loader之前还是之后执行 ('after' || 'before')
    //   queue: 'before',
    // }
  ],

  // 内部loader的一些设置
  // 所有babel强行使用ast转换
  loaderOption: {
    sass: {},
    js: {
       babel: null,
    },
    ts: {
      babel: {
        presets: [
          ['@babel/preset-typescript'],
        ],
      }
    },
    react: {
      babel: {}
    },
    less: {
      compress: false,
      javascriptEnabled: true
    },
  },

  // plugin相当于....大杂烩
  // 一个函数或对象,需要包含一个init方法
  // plugin会在构建前注册（调用init）
  // init方法上下文为codev 参数为一个plguin对象
  // plugin对象可以注册loader、hook、rules
  plugins: [

  ],

  // 钩子函数,构建过程中会触发各种钩子，如模块查找完成、模块loader前....
  // 事件的上下文为codev对象
  hooks: {
    // // 开始构建
    // 'codevStart': function () {},
    // // 模块创建之后触发（还未解析任何信息）
    // 'moduleCreate': function (module) {},
    // // 遍历某个ast时触发(进入节点)
    // 'enterAstNode': function (module, node, parent) {},
    // // 遍历某个ast时触发(离开节点)
    // 'leaveAstNode': function (module, node, parent) {},
    // // 模块装载完成 (解析完毕 但还未解析其依赖模块)
    // 'moduleLoaderComplete': function (module) {},
    // // 模块解析完毕（包括其依赖模块也解析完毕）
    // 'moduleEnd': function (module) {},
    // // 模块树构建完成
    // 'dependTreeComplete': function (depTree) {},
    // // 在统计模块信息时遍历模块时会触发
    // 'statisticsModule': function (module) {},
    // // 统计项目信息完成
    // 'statistics': function (result, depTree) {},
    // // 构建结束
    // 'codevEnd': function (depTree) {},
  },

  // 检验的规则
  // test - 对哪些文件校验 不填就是所有 (选填)
  // label - 校验哪些信息 info对应module.info.label 可以是string或正则 如果不填将会匹配module所有信息 只要出现不合法即记录警告
  // standard - 校验的标准 值可以是基础数据类型、函数(return boolean | warning)、正则表达式、数组（多个standard）
  // 关于standard
  //   standard是string ： '>400'大于400 '<400'小于400 '=400'等于400
  //   standard是函数 standard(module, infos)
  //   standard是数组将会逐个校验
  //   
  // message - 规则描述
  // type - 报警类型 warning | error 也可以数组 
  //   type如果是数组则对应standard数组
  rules: [
    // {
    //   test: /\.(js|ts|tsx)$/,
    //   label: '代码行数',
    //   standard: '>400',
    //   message: '代码行数超出',
    //   type: 'warning',
    // }
  ],

  // 在收集项目信息时的一些配置
  // 这个模块树会直接在前端关系图谱中显示
  moduleTree: {
    // 要不要过滤第三方包的子模块 不填就不过滤
    excludeExternalPack: /node_modules/
  },

  // 统计模块信息的配置
  statistics: {
    // 统计PublicInfo时需要过滤啥玩意吗？
    // 正则或者函数
    excludeInfo: null,

    // 统计报错信息时需要过滤啥玩意吗？
    // 正则或者函数
    excludeError: null,
  },

  rulesOptions: {
    defaultWarningType: 'error',
  },

  // 构建结束后是否启用view预览
  view: true,
}