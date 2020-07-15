class Observer {
  constructor(data) {
    this.$data = data;
    this.observe(data);
  }

  observe(data) {
    if (data && typeof data === "object") {
      Object.keys(data).forEach((key) => {
        this.defineReactive(data, key, data[key]);
      });
    }
  }

  defineReactive(obj, key, val) {
    this.observe(val); // 递归处理: "user.info.name"

    // 第三步: 将当前属性的所有属性的所有 watcher 放到 当期属性的 subscribe 对象中管理起来
    const subscribe = new Subscribe();
    Object.defineProperty(obj, key, {
      get: () => {
        Subscribe.target && subscribe.addWatcher(Subscribe.target);
        return val;
      },
      set: (newVal) => {
        if (val !== newVal) {
          this.observe(newVal);
          val = newVal;
          subscribe.notify();
        }
      },
    });
  }
}
