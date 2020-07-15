class Watcher {
  constructor(vm, expr, callback) {
    this.vm = vm;
    this.expr = expr;
    this.callback = callback;

    // 在创建观察者的时候获取旧的值
    this.oldVal = this.getOldVal();
  }
  getOldVal() {
    Subscribe.target = this;
    const oldVal = Utils.getVal(this.vm, this.expr);
    Subscribe.target = null;
    return oldVal;
  }
  update() {
    // 更新的时候再次获取值, 判断是否需要执行回调
    const newVal = Utils.getVal(this.vm, this.expr);
    if (this.oldVal !== newVal) {
      this.callback(newVal, this.oldVal);
    }
  }
}

class Subscribe {
  constructor() {
    this.watchers = [];
  }
  addWatcher(watcher) {
    this.watchers.push(watcher);
  }
  notify() {
    this.watchers.forEach((watcher) => watcher.update());
  }
}
