/**
 * 动画 - 镜头旋转
 */
function Animate(GL) {
  this.fns = []
  this.GL = GL
}
Animate.prototype.run = function () {
  requestAnimationFrame(this.run.bind(this))
  for (let i = this.fns.length; i --;) {
    this.fns[i]()
  }
  this.GL.controls.update()
  this.GL.render()
}

/**
 * 创建3d场景
 * @param  {element} container 容器
 * @param  {number} width      3d场景的宽度
 * @param  {number} height     3d场景的高度
 * @return {object}            3d场景
 */
function createGL(container, width, height) {
  // 场景
  const scene = new THREE.Scene()

  // 相机
  const camera = new THREE.PerspectiveCamera( 100, width / height, 1, 10000 )
  camera.position.z = 200
  camera.position.y = 0
  camera.position.x = 0

  // 渲染器
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    precision: 'highp',
    alpha: true
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)

  // 相机控制器
  const controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.target.set( 0, 0, 0 );
  controls.enableDamping = true
  controls.dampingFactor = 0.28
  controls.zoomSpeed = 0.7
  controls.rotateSpeed = 0.6

  // 添加到页面
  container.appendChild(renderer.domElement)

  return {
    scene,
    camera,
    renderer,
    controls,
    render: function () {
      this.renderer.render(this.scene, this.camera)
    }
  }
}

/**
 * 获取节点Z轴坐标
 * @param  {array} nodes  节点
 * @param  {number} n     采样次数
 */
function createZaxis(nodes, _links, _nodes, n) {
  const forceLink = d3
    .forceLink(_links)
    .distance(50)
    .strength(0.2)
    .iterations(1)

  const forceCenter = d3
    .forceCenter()
    .x(0)
    .y(0)

  const simulation = d3.forceSimulation(d3.values(_nodes))
    .force('charge', d3.forceManyBody().strength(30))
    .force('collide', d3.forceCollide().radius(17))
    .force('link', forceLink)
    .force('center', forceCenter) 
    .on('tick', () => {
      if (n) {
        n --
        for (let i = 0; i < nodes.length; i ++) {
          nodes[i].z = _nodes[i].x
        }
      }
    })
}

/**
 * 绘制关系图谱
 * @param  {object} data       codev构建后的数据
 * @param  {object} GL         3d场景对象
 * @param  {object} theme      图表颜色主题
 * @param  {object} event      事件监听器
 */
function drawMap(data, GL, theme, event) {
  const width = window.innerWidth
  const height = window.innerHeight
  const links = []
  const nodes = []
  const moduleTree = data.result.moduleTree
  const loader = new THREE.FontLoader()
  const fns = []
  const addMethod = function (fn) { fns.push(fn) }

  let id
  let isMove = true
  let clickId

  // 为数据添加更新view方法
  nodes.updatePosition = function () {
    for (let i = 0; i < this.length; i ++) {
      const node = this[i]
      node.circle.position.set(node.x, node.y, node.z)
      node.text.position.set(node.x, node.y, node.z)
    }
  }
  nodes.updateAngle = function () {
    for (let i = 0; i < this.length; i ++) {
      const node = this[i]
      node.circle.rotation.y = node.text.rotation.y = GL.controls.getAzimuthalAngle()
      node.circle.rotation.x = node.text.rotation.x = GL.controls.getPolarAngle() - Math.PI / 2
    }
  }
  nodes.visible = function (n) {
    for (let i = 0; i < this.length; i ++) {
      const node = this[i]
      if (node.id === n.__nodeId__) {
        node.circle.material.opacity = 1
        node.text.material.opacity = 1
      } else {
        node.circle.material.opacity = 0.5
        node.text.material.opacity = 0.5
      }
    }
  }

  links.updatePosition = function () {
    for (let i = 0; i < this.length; i ++) {
       const line = this[i].line
       const link = this[i]
      line.geometry.verticesNeedUpdate = true
      line.geometry.vertices[0] = new THREE.Vector3(link.source.x, link.source.y, link.source.z)
      line.geometry.vertices[1] = new THREE.Vector3(link.target.x, link.target.y, link.target.z)
    }
  }
  links.visible = function (node) {
    for (let i = this.length; i --;) {
      const link = this[i]
      link.material.visible = false
      link.source.text.material.color.set(theme.main)
      link.target.text.material.color.set(theme.main)
    }

    for (let i = this.length; i --;) {
      const link = this[i]
      if (link.source.id === node.__nodeId__ || link.target.id === node.__nodeId__) {
        link.material.visible = true
        link.source.text.material.color.set(theme.black)
        link.target.text.material.color.set(theme.black)

      }
    }
  }

  // 处理数据 - 生成links
  for (let i = 0; i < moduleTree.moduleKeys.length; i ++) {
    const module = moduleTree.modules[moduleTree.moduleKeys[i]]
    nodes.push(module)
    if (module.depends.length) {
      module.depends.forEach(id => {
        links.push({
          source: module,
          target: moduleTree.modules[id],
        })
      })
    }
  }

  const nodeMaterial = new THREE.MeshBasicMaterial({ color: theme.main })
  const nodeGeometry = new THREE.CircleBufferGeometry(6, 32)

  return new Promise(function (resolve) {
    // 加载字体
    loader.load( './helvetiker_regular.typeface.json', function ( font ) {
      
      // 绘制节点
      nodes.forEach(function (node) {
        // 圆点
        node.circle = new THREE.Mesh(nodeGeometry, nodeMaterial)
        GL.scene.add(node.circle)

        // 文本
         const textMaterial = new THREE.MeshBasicMaterial({
          color: theme.main,
          transparent: true,
          opacity: 1,
          side: THREE.DoubleSide
        })
        const moduleName = node.origin === 'package' ? 
                           node.packName :
                           node.fileName === 'index' ?
                           node.fileName + '(' + node.listName + ')' + node.suffix :
                           node.fileName + node.suffix
        const shapes = font.generateShapes(moduleName, 4)
        const geometry = new THREE.ShapeBufferGeometry(shapes)
        geometry.computeBoundingBox()
        geometry.translate(- 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x ), -11, 0)
        node.text = new THREE.Mesh(geometry, textMaterial)
        GL.scene.add(node.text)

        node.circle.__type__ = 'circle'
        node.circle.__nodeId__ = node.id
      })

      // 绘制线条
      links.forEach(function (link) {
        link.material = new THREE.LineBasicMaterial({ color: theme.line })
        link.geometry = new THREE.Geometry()
        link.line = new THREE.Line(link.geometry, link.material)
        link.line.material.visible = false
        GL.scene.add(link.line)
        link.line.__type__ = 'line'
      })

      // d3...
      createZaxis(nodes, JSON.parse(JSON.stringify(links)), JSON.parse(JSON.stringify(nodes)), 2)

      const forceLink = d3
        .forceLink(links)
        .distance(50)
        .strength(0.2)
        .iterations(1)

      const forceCenter = d3
        .forceCenter()
        .x(0)
        .y(0)

      const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(20))
      .force('collide', d3.forceCollide().radius(20))
      .force('link', forceLink)
      .force('y', d3.forceY(width))
      .force('center', forceCenter)
      .on('tick', function () {
        nodes.updatePosition()
        links.updatePosition()
        GL.render()
      })
      .on('end', function () {
        resolve({
          simulation,
          nodes,
          links,
          addMethod,
        })
      })

      // 为图表元素绑定移动事件
      event.on('mousemove', function (circle) {
        if (isMove) {
          if (id === circle.__nodeId__) return
          id = circle.__nodeId__
          links.visible(circle)
        }
      })

      // 为图表元素绑定点击事件
      event.on('click', function (circle) {
        if (!circle) return
        if (clickId === circle.__nodeId__) {
          links.visible({__nodeId__: null})
          clickId = null
          isMove = true
          fns.forEach(function (fn) { fn(circle.__nodeId__, false) })
        } else {
          clickId = circle.__nodeId__
          links.visible(circle)
          isMove = false
          fns.forEach(function (fn) { fn(circle.__nodeId__, true) })
        }
      })

    })
  })
}

function monitor(GL, animate, width, height) {
  const moveFns = []
  const clickFns = []
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const not = {__nodeId__: '--null--'}
  let isMove = true

  window.addEventListener('mousemove', function () {
    mouse.x = ( event.clientX / width ) * 2 - 1
    mouse.y = - ( event.clientY / height ) * 2 + 1
    raycaster.setFromCamera(mouse, GL.camera)
    const intersects = raycaster.intersectObjects(GL.scene.children).filter(function (o) {
      return o.object.__type__ === 'circle'
    })
    isMove && moveFns.forEach(function (fn) {fn(intersects.length ? intersects[0].object : not)})
  }, false)

  window.addEventListener('click', function (event) {
    mouse.x = ( event.clientX / width ) * 2 - 1
    mouse.y = - ( event.clientY / height ) * 2 + 1
    raycaster.setFromCamera(mouse, GL.camera)
    const intersects = raycaster.intersectObjects(GL.scene.children).filter(function (o) {
      return o.object.__type__ === 'circle'
    })
    clickFns.forEach(function (fn) {fn(intersects.length ? intersects[0].object : null)})
  }, false)

  window.addEventListener('mousedown', function (event) {
    isMove = false
  })

  window.addEventListener('mouseup', function (event) {
    isMove = true
  })

  return {
    on: function (event, fn) {
      event === 'mousemove' ? moveFns.push(fn) : 
      event === 'click' ? clickFns.push(fn) : false
    }
  } 
}


(function () {
  const container = document.getElementById('gl')
  const theme = {
    main: '#34DA88',
    line: '#cecece',
    black: '#223548',
  }
  const width = window.innerWidth
  const height = window.innerHeight

  // 创建3d场景对象
  const GL = createGL(container, width, height)

  // 创建动画运行器
  const animate = new Animate(GL)

  // 创建事件监听器
  const event = monitor(GL, animate, width, height)

  let map = null

  function init(data) {
    addInfo(data.result)

    // 绘制图表
    drawMap(data, GL, theme, event).then(function (chart) {
      map = chart
      // 图表初始化后添加相机控制
      animate.fns.push(function () {
        map.nodes.updateAngle()
      })
      animate.run()

      // 当图表节点切换
      map.addMethod(function (id, visible) {
        if (visible) {

        }
      })

      console.log(chart)
    })
  }

  // 填充数据
  function addInfo(data) {
    let list = `
      <div>Name: <span>${data.name}</span></div>
      <div>Description: <span>${data.description}<span></div>
      <div>Version: <span>${data.version}<span></div>
      <div>Module Count: <span>${data.moduleCount}<span></div>
      <div>Error Count: <span>${data.errorCount}<span></div>
    `
    document.getElementById('projectInfo').innerHTML = list
  }

  // 获取数据
  fetch("./tree").then(function(response){
    if(response.status !== 200){
      console.log(response.status)
      return
    }
    response.json().then(init);
  }).catch(function(err){
    console.log(err.message)
  }) 
})()