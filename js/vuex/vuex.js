// ! disable some eslint rules
/* eslint-disable no-unused-vars */

import Vue from "vue";

/**
 * 根据官方文档的要求, 如果要使用 Vue.use 的这种形式插件必须提供一个 install 方法
 */
const install = (Vue, options = {}) => {
  // 在每个组件创建之前都执行 beforeCreate
  // 组件的创建顺序是 Root(new Vue) -> App -> HelloWorld
  // 如果是根组件, 默认就会有 store, 如果不是, 那么
  // 只需要将父组件的 $store 赋值给这个组件
  Vue.mixin({
    beforeCreate() {
      const options = this.$options;
      if (options.store) {
        this.$store = options.store;
      } else if (options.parent && options.parent.$store) {
        this.$store = options.parent.$store;
      }
    }
  });
};

/**
 * 在使用的时候必须要 new Vuex.Store({...})
 */
class Store {
  // 构造方法
  constructor(options) {
    // this.state = options.state || {};
    // 使用 Vue.util.defineReactive 将 state 定义为响应式的数据
    Vue.util.defineReactive(this, "state", options.state || {});
    this.modules = new ModuleCollection(options);
    this._initModules([], this.modules.root);
  }

  // 初始化模块
  _initModules(arr, module) {
    // arr: [] ['home'] ['user'] ['user', 'login']
    if (arr.length) {
      // 如果是子模块, 取出所有的数据定义响应式数据
      const parent = arr
        .splice(0, arr.length - 1)
        .reduce((data, key) => data[key], this.state);
      Vue.set(parent, arr[arr.length - 1], module._state);
    }

    // 初始化模块的时候初始化getters/mutations
    const raw = module._raw;
    this._initGetters(raw);
    this._initMutations(raw);
    this._initActions(raw);

    // 如果不是子模块就需要一层层取出子模块然后安装
    Object.keys(module._children).forEach(childModlueName => {
      const childModule = module._children[childModlueName];
      this._initModules(arr.concat(childModlueName), childModule);
    });
  }

  // dispatch 方法
  dispatch = (type, payload) => {
    this.actions[type].forEach(fn => fn(this, payload));
  };

  // commit 方法
  commit = (type, payload) => {
    this.mutations[type].forEach(fn => fn(this.state, payload));
  };

  // 初始化 actions
  _initActions(module) {
    const actions = module.actions;
    this.actions = this.actions || Object.create(null);
    if (actions && typeof actions === "object") {
      Object.keys(actions).forEach(key => {
        this.actions[key] = this.actions[key] || [];
        this.actions[key].push(payload => actions[key](this, payload));
      });
    }
  }

  // 初始化 mutations
  _initMutations(module) {
    const mutations = module.mutations;
    this.mutations = this.mutations || Object.create(null);
    if (mutations && typeof mutations === "object") {
      Object.keys(mutations).forEach(key => {
        this.mutations[key] = this.mutations[key] || [];
        this.mutations[key].push(payload =>
          mutations[key](module.state, payload)
        );
      });
    }
  }

  // 初始化 getters
  _initGetters(module) {
    this.getters = this.getters || Object.create(null);
    Object.keys(module.getters).forEach(key => {
      Object.defineProperty(this.getters, key, {
        get: () => module.getters[key](module.state)
      });
    });
  }
}

/**
 * @author: liaohui5
 * @description: 处理 vuex 模块化
 * @param {type}
 * @return: void
 */
class ModuleCollection {
  constructor(rootModule) {
    this.register([], rootModule);
  }

  /**
   * 注册模块
   * @param {Array} arr key数组 a.b.c ['a', 'b', 'c']
   * @param {*} rootModule 根模块
   */
  register(arr, rootModule) {
    // arr: [] [home] [user] [user, login]
    const module = {
      _raw: rootModule,
      _state: rootModule.state,
      _children: {}
    };

    // 保存模块信息
    if (arr.length === 0) {
      // 根模块(因为只有第一次进入的时候, arr.length 才为0)
      this.root = module;
    } else {
      // 获取这个子模块的父级模块(不要循环最后一个, 一层层取值, 最后一个就是自己)
      // ['user', 'account', 'login']: login 就是本模块的名字, 将本模块添加到父级模块
      const parent = arr
        .splice(0, arr.length - 1)
        .reduce((data, key) => data._children[key], this.root);
      parent._children[arr[0]] = module;
    }

    const modules = rootModule.modules || {};
    Object.keys(modules).forEach(childModlueName => {
      const childModule = modules[childModlueName];
      this.register(arr.concat(childModlueName), childModule);
    });

    /*
    格式化模块信息:
    const root = {
      _raw: rootModule,
      _state: rootModule.state,
      _children: {
        home: {
          _raw: rootModule,
          _state: rootModule.state,
          _children: {}
        },
        user: {
          _raw: rootModule,
          _state: rootModule.state,
          _children: {
            login: {
              _raw: rootModule,
              _state: rootModule.state,
              _children: {}
            }
          }
        }
      }
    }
    */
  }
}
export default { install, Store };
