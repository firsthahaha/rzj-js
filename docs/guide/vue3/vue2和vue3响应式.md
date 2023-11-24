# vue2响应式
````javascript
// 响应式数据处理，构造一个响应式对象
// 给数据添加监听器是在构造函数中，所以数据对象在构造函数执行之前就已经被创建了
// 数据对象在构造函数执行之后才被添加到响应式对象中
// 因此，在构造函数中无法访问到响应式对象中的数据

class Observer {
  constructor(data) {
    this.data = data
    this.walk(data)
  }

  // 遍历对象的每个 已定义 属性，分别执行 defineReactive
  walk(data) {
    if (!data || typeof data !== 'object') {
      return
    }

    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }

  // 为对象的每个属性重新设置 getter/setter
  defineReactive(obj, key, val) {
    // 每个属性都有单独的 dep 依赖管理
    // 进来为每个属性设置一个单独的dep
    const dep = new Dep()

    // 通过 defineProperty 进行操作代理定义
    Object.defineProperty(obj, key, {
        // 是否枚举
        enumerable: true,
        // 是否可以修改和删除
        configurable: true,
        // 值的读取操作，进行依赖收集
        get() {
            if (Dep.target) {
                dep.depend()
            }
            return val
        },
        // 值的更新操作，触发依赖更新
        set(newVal) {
            if (newVal === val) {
                return
            }
            val = newVal
            dep.notify()
        }
    })
  }
}

// 观察者的构造函数，接收一个表达式和回调函数
class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm
    this.getter = parsePath(expOrFn)
    this.cb = cb
    this.value = this.get()
  }

  // watcher 实例触发值读取时，将依赖收集的目标对象设置成自身，
 	// 通过 call 绑定当前 Vue 实例进行一次函数执行，在运行过程中收集函数中用到的数据
  // 此时会在所有用到数据的 dep 依赖管理中插入该观察者实例
  get() {
    Dep.target = this
    const value = this.getter.call(this.vm, this.vm)
    // 函数执行完毕后将依赖收集目标清空，避免重复收集
    Dep.target = null
    return value
  }

  // dep 依赖更新时会调用，执行回调函数
  update() {
    const oldValue = this.value
    this.value = this.get()
    this.cb.call(this.vm, this.value, oldValue)
  }
}

// 依赖收集管理者的构造函数
class Dep {
  constructor() {
    // 保存所有 watcher 观察者依赖数组
    this.subs = []
  }

  // 插入一个观察者到依赖数组中
  addSub(sub) {
    this.subs.push(sub)
  }

  // 收集依赖，只有此时的依赖目标（watcher 实例）存在时才收集依赖
  depend() {
    if (Dep.target) {
      this.addSub(Dep.target)
    }
  }

  // 发送更新，遍历依赖数组分别执行每个观察者定义好的 update 方法
  notify() {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}

Dep.target = null

// 表达式解析
function parsePath(path) {
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) {
        return
      }
      obj = obj[segments[i]]
    }
    return obj
  }
}


````
>在 Vue 2 中，如果你直接使用 `this.myObject = { bar: "New Property" }` 来重新赋值整个对象，那么新的属性 `bar` 会变成响应式的。
>这是因为在 Vue 2 中，对象的响应式属性是通过劫持对象的属性访问来实现的。当你重新赋值整个对象时，Vue 会重新设置对象的属性，并确保新属性是响应式的。
>因此，你可以放心地使用 `this.myObject = { bar: "New Property" };` 来添加新属性，并且这个新属性会是响应式的。不需要额外使用 `Vue.set` 或 `this.$set` 方法。
## vue3响应式原理
>Vue3 使用了 Proxy 来实现响应式，它是一个 ES6 的特性，它可以用来自定义对象中的属性访问操作。
> Proxy在代理一个对象的时候是代理一整个对象，所以新增的属性也会变成响应式的，但是在vue2中defineProperty使用这个代理的是每个属性，所以新增的属性不会变成响应式的。但是如果重新赋值的话，可以使用this.$set或者Object.assign（浅拷贝）可以把属性变成响应式的
proxy原型方法
1. const proxy = new Proxy(target, handler) proxy.get(target, propKey, receiver)：拦截对象属性的读取操作；`target`是目标对象，`propKey`是属性的名称，`receiver`是代理对象。
2. const proxy = new Proxy(target, handler) proxy.set(target, propKey, value, receiver)：拦截对象属性的设置操作`target`是目标对象，`propKey`是属性的名称，`value`是属性值，`receiver`是代理对象。

在 Vue 中体现最为明显的一点就是：Proxy 代理对象之后不仅可以拦截对象属性的读取、更新、方法调用之外，对整个对象的新增、删除、枚举等也能直接拦截，而 Object.defineProperty 只能针对对象的已知属性进行读取和更新的操作拦截。
```javascript
const obj = { name: 'MiyueFE', age: 28 }
const proxyObj = new Proxy(obj, {
  get(target, property) {
    console.log(`Getting ${property} value: ${target[property]}`)
    return target[property] 
  },
  set(target, property, value) {
    console.log(`Setting ${property} value: ${value}`)
    target[property] = value
  },
  deleteProperty(target, property) {
    console.log(`Deleting ${property} property`)
    delete target[property]
  },
})

console.log(proxyObj.name) // Getting name value: MiyueFE, 输出 "MiyueFE"
proxyObj.name = 'MY' // Setting name value: MY
console.log(proxyObj.name) // Getting name value: MY, 输出 "MY"
delete proxyObj.age // Deleting age property
console.log(proxyObj.age) // undefined
