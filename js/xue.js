/**
 * 核心控制类
 */
class Xue {
  constructor(options) {
    if (Utils.isElement(options.el)) {
      this.$el = options.el;
    } else {
      this.$el = document.querySelector(options.el);
    }
    this.$data = options.data || {};
    this.proxyData();
    this.$methods = options.methods || {};
    this.$computed = options.computed || {};
    this.computed2data();

    if (this.$el) {
      // 1. 给外界传入的所有数据(data)都添加 get/set 方法, 就可以监听数据的变化了
      new Observer(this.$data);
      new Compiler(this);
    }
  }

  // 把数据代理到 xue 实例上
  proxyData() {
    Object.keys(this.$data).forEach((key) => {
      Object.defineProperty(this, key, {
        get: () => this.$data[key],
        set: (val) => (this.$data[key] = val),
      });
    });
  }

  // 将计算属性添加到data中
  computed2data() {
    Object.keys(this.$computed).forEach((key) => {
      Object.defineProperty(this.$data, key, {
        get: () => this.$computed[key].call(this),
      });
    });
  }
}
