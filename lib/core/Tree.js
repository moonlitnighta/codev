/**
* @file 构建一个树对象
**/

function Tree() {
  if (!(this instanceof Tree)) {
    return new Tree
  }

  this.enter = []
  this.modules = {}
  this.moduleKeys = []
  this.total = 0
}

Tree.prototype.addModule = function (module) {
  const id = module.id
  if (!this.modules[id]) {
    this.modules[id] = module
    this.moduleKeys.push(id)
    this.total ++
  }
  return this.modules[id]
}

Tree.prototype.moduleEach = function (callback, exclude) {
  const mks = this.moduleKeys
  for (let i = 0; i < mks.length; i ++) {
    const m = this.modules[mks[i]]
    !(exclude && exclude(m.filePath)) && callback(m)
  }
}

Tree.prototype.enterEach = function (callback, exclude) {
  const enter = this.enter
  const expired = {}

  for (let i = 0; i < enter.length; i ++) {
    each(enter[i])
  }

  function each(m, p) {
    if (exclude && exclude(m.filePath)) {
      return
    }

    const res = callback(m, p)
    if (res) {
      return
    }

    if (expired[m.id]) {
      return
    } else {
      expired[m.id] = true
    }

    if (m.depends.length) {
      for (let i = 0; i < m.depends.length; i ++) {
        each(m.depends[i].module, m)
      }
    }
  }
}

module.exports = Tree
