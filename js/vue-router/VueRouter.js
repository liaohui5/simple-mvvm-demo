// ! disable some eslint rules
/* eslint-disable no-unused-vars */

class RouteInfo {
  constructor() {
    this.currentPath = null;
  }
}

class VueRouter {
  constructor(options) {
    this.mode = options.mode || "hash";
    this.routes = options.routes || {};
    this.routesMap = this.createRoutesMap();
    this.routeInfo = new RouteInfo();
    this._initDefault();
  }

  // 初始化默认信息
  _initDefault() {
    if (this.mode === "hash") {
      if (!location.hash) {
        location.hash = "/";
      }
      window.addEventListener("load", () => {
        console.info("hash mode load");
        // 页面加载完之后执行
        this.routeInfo.currentPath = location.hash.slice(1); // #/home -> home
      });
      window.addEventListener("hashchange", () => {
        // hash变化之后执行: 重新获取hash然后赋值给 this.routeInfo.currentPath
        console.info("hash changed");
        this.routeInfo.currentPath = location.hash.slice(1); // #/home -> home
      });
    } else {
      const { pathname } = location;
      if (!pathname) {
        location.pathname = "/";
      }
      window.addEventListener("load", () => {
        console.info("history mode load");
        this.routeInfo.currentPath = pathname;
      });
      window.addEventListener("popstate", () => {
        console.info("popstate");
        this.routeInfo.currentPath = pathname;
      });
    }
  }

  // 提取路由信息
  createRoutesMap() {
    // {
    //   '/': Home,
    //   '/user': User
    // }
    const map = {};
    this.routes.reduce((map, route) => {
      map[route.path] = route.component;
      return map;
    }, map);
    return map;
  }
}

VueRouter.install = (Vue, options) => {
  // 混入全局 变量
  Vue.mixin({
    beforeCreate() {
      const options = this.$options;
      if (options.store) {
        // 因为在渲染组件的时候: 页面不一定就执行了 onload 的监听函数, 所以
        // 需要使用 Vue.util.defineReactive 将 $router 定义为一个响应式数据
        // 当 $router 发生变化的时候就重新渲染页面
        this.$router = options.router;
        Vue.util.defineReactive(this, "xxx", this.$router);
      } else if (options.parent && options.parent.$router) {
        this.$router = options.parent.$router;
      }
      this.$route = this.$router.routeInfo;
    }
  });

  // 注册全局组件: router-view
  Vue.component("router-view", {
    render(h) {
      const { routesMap, routeInfo } = this._self.$router;
      const component = routesMap[routeInfo.currentPath];
      return h(component);
    }
  });

  // 注册全局组件: router-link
  Vue.component("router-link", {
    props: {
      to: {
        type: String,
        required: true
      }
    },
    render() {
      let path = this.to;
      if (this._self.$router.mode === "hash") {
        path = "#" + path;
      }
      return <a href={path}>{this.$slots.default}</a>;
    }
  });
};

export default VueRouter;
