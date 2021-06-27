import { forEachValue } from "../utils"
import Module from "./module"

export default class ModuleCollection {
  constructor(rootModule) {
    this.root = null
    this.register(rootModule, [])

  }

  register(rawModule, path) {
    const newModule = new Module(rawModule)
    if (path.length == 0) {
      this.root = newModule
    } else {
      const parent = path.slice(0, -1).reduce((module, current) => {
        return module.getChild(current)
      }, this.root)
      parent.addChild(path[path.length - 1], newModule)
    }

    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(rawChildModule, path.concat(key))
      })
    }

    return newModule
  }

  getNamespaced(path) {
    let module = this.root

    return path.reduce((namespaceStr, key) => {
      module = module.getChild(key)
      return namespaceStr + (module.namespaced ? key + '/' : '')
    }, '')
  }
}