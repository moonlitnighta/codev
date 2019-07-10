/**
* @file 起个静态服务 就这么简单....
**/

const express = require('express')
const path = require('path')
const opn = require('opn')
const app = express()

const static = path.resolve(__dirname, '../view/')

module.exports = function (cv, options) {
  cv.addHook('codevEnd', function (result){
    app.use(express.static(static))
    app.get('/tree', (req, res) => {
      res.send({
        result,
      })
    })
    app.listen(8000, () => console.log('view open!'))

    // 打开浏览器
    opn(`http://localhost:8000/codev.html`)
    
  })
}