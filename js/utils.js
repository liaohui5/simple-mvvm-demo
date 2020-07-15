const Utils = {
  // 判断是否是一个元素节点
  isElement(node) {
    return node.nodeType === 1;
  },

  // 获取表达式的值 expr(插值表达式): "user.info.name"
  getVal(vm, expr) {
    return expr.split(".").reduce((data, key) => data[key.trim()], vm.$data);
  },

  // 根据表达式设置值 expr(插值表达式): "user.info.name"
  setVal(vm, expr, value) {
    expr.split(".").reduce((data, key, i, arr) => {
      if (i === arr.length - 1) {
        data[key] = value;
      }
      
      return data[key];
    }, vm.$data);
  },

  // 获取{{}}差值表达式的值
  getContentVal(vm, expr) {
    const reg = /\{\{(.+?)\}\}/gi;
    return expr.replace(reg, (...args) => this.getVal(vm, args[1]));
  },

  // v-model 处理
  model(node, expr, vm) {
    // 第二步: 在第一次编译模板的时候, 给所有的属性添加观察者
    // 1. 用 Object.defineProperty 给所有数据添加 get 和 set 方法
    // 2. 在第一次编译模板的时候就给所有的属性添加 watcher
    // 3. 将属性放的 watcher 放到 Subscribe 中管理

    new Watcher(vm, expr, (newVal, oldVal) => {
      node.value = newVal;
    });
    node.value = this.getVal(vm, expr);

    // 实现界面驱动数据
    node.addEventListener("input", (e) => {
      this.setVal(vm, expr, e.target.value);
    });
  },

  // v-html 处理
  html(node, expr, vm) {
    new Watcher(vm, val, (newVal, oldVal) => {
      node.innerHTML = newVal;
    });
    node.innerHTML = this.getVal(vm, expr);
  },

  // v-text 处理
  text(node, expr, vm) {
    new Watcher(vm, expr, (newVal, oldVal) => {
      node.innerText = newVal;
    });
    node.innerText = this.getVal(vm, expr);
  },

  // 处理{{}}文本内容
  content(node, expr, vm) {
    // 如果 val 是: {{name}} --- {{age}}, 两个都加上 Watcher
    // 但是数据发生变化的时候, 先一个个替换, 然后整体替换
    const reg = /\{\{(.+?)\}\}/gi;
    expr.replace(reg, (...args) => {
      new Watcher(vm, args[1], () => {
        node.textContent = this.getContentVal(vm, expr);
      });
      return this.getVal(vm, args[1]);
    });
    node.textContent = this.getContentVal(vm, expr);
  },

  // 监听事件
  on(node, fn, vm, event) {
    node.addEventListener(event, (...args) => vm.$methods[fn].call(vm, args));
  },
};
