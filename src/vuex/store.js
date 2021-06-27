import { reactive, watch } from "vue"
import { storeKey } from "./injectKey"
import ModuleCollection from "./module/module-collection"
import { forEachValue, isPromise } from "./utils";


function getNestedState(state, path) {
  return path.reduce((state, key) => state[key], state)
}

function resetStoreState(store, state) {
  store._state = reactive({ data: state })

  const wrapperedGetters = store._wrappedGetters

  store.getters = {}

  forEachValue(wrapperedGetters, (getter, key) => {
    Object.defineProperty(store.getters, key, {
      enumerable: true,
      get: () => getter()
    })
  })
}

function installModule(store, rootState, path, module) {
  let isRoot = !path.length; // 如果数组为空数组，说明是根，否则不是

  const namespaced = store._modules.getNamespaced(path)


  if (!isRoot) {

    let parentState = path.slice(0,-1).reduce((state, key) => state[key], rootState)

    store._withCommit(() => {
      parentState[path[path.length-1]] = module.state
    })
  }

  // getters

  module.forEachGetter((getter, key) => {
    store._wrappedGetters[namespaced + key] = () => {
      return getter(getNestedState(store.state, path))
    }
  })

  // mutation
  module.forEachMutation((mutation, key) => {
    const entry = store._mutations[namespaced + key] || (store._mutations[namespaced + key] = [])

    entry.push((payload) => { // store.commit('add', payload)
      mutation.call(store, getNestedState(store.state, path), payload)
    })
  })

  // actions action执行后返回一个promise
  module.forEachAction((action, key) => {
    const entry = store._actions[namespaced + key] || (store._actions[namespaced + key] = [])

    entry.push((payload) => {
      let res = action.call(store, store, payload)

      if (!isPromise(res)) {
        return Promise.resolve(res)
      }

      return res
    })
  })

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })

  if (store.strict) {
    enableStrictMode(store)
  }

}

function enableStrictMode(store) {
  watch(() => store._state.data, () => {
    console.assert(store._commiting, 'do not mutate vuex store state outside mutation handles')
  }, { deep: true, flush: 'sync' })
}

export default class Store {
  constructor(options) {
    const store = this
    store._modules = new ModuleCollection(options)

    store._wrappedGetters = Object.create(null)
    store._mutations = Object.create(null)
    store._actions = Object.create(null)

    store.strict = options.strict || false // 是不是严格模式

    store._commiting = false

    // 调用的时候，mutation， mutation中是同步


    // 定义状态
    const state = store._modules.root.state
    resetStoreState(store, state)

    installModule(store, state, [], store._modules.root)

    store._subscribes = []

    options.plugins.forEach(plugin => plugin(store))

  }

  subscribe(fn) {
    this._subscribes.push(fn)
  }

  get state() {
    return this._state.data
  }

  replaceState(newState) {
    // 严格模式不能直接修改状态
    this._withCommit(() => {
      this._state.data = newState
    })
    
  }

  _withCommit(fn) {
    const commiting = this._commiting
    this._commiting = true
    fn()
    this._commiting = commiting
  }

  commit = (type, payload) => {
    const entry = this._mutations[type] || []

    this._withCommit(() => {
      entry.forEach(handler => handler(payload))
    })

    this._subscribes.forEach(sub => sub({ type, payload}, this.state))
  }

  dispatch = (type, payload) => {
    const entry = this._actions[type] || []
    return Promise.all(entry.map(handler => handler(payload)))
  }

  install(app, injectKey) { // createApp().use(store, storeName?)

    app.provide(injectKey || storeKey, this)
    app.config.globalProperties.$store = this //为vue实例原型上添加$store属性
  }

  registerModule(path, rawModule) {
    const store = this
    if (typeof path == 'string') path = [path]

    const newModule = store._modules.register(rawModule, path)

    installModule(store, store.state, path, newModule)

    resetStoreState(store, store.state)
  }
}
