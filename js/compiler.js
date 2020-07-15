/**
 * 模板编译类
 */
class Compiler {
  constructor(vm) {
    this.vm = vm;
    // 1. 将内容全部移入到内存中
    const frgmt = this.node2fragment(vm.$el);

    // 2. 编译内存中的模板
    this.compileTemplate(frgmt);

    // 3. 将编译好的模板重新渲染出来
    vm.$el.appendChild(frgmt);
  }

  // 编译内存中的模板
  compileTemplate(frgmt) {
    const nodes = Array.from(frgmt.childNodes);
    nodes.forEach((node) => {
      if (Utils.isElement(node)) {
        // 元素节点: 替换掉元素上的指令 v-model v-html v-text
        // 如果元素有子元素, 也需要处理(递归处理)
        this.compileElement(node);
        this.compileTemplate(node);
      } else {
        // 文本节点: 替换 {{}} 中间的值
        this.compileText(node);
      }
    });
  }

  // 编译元素节点
  compileElement(node) {
    const attrs = Array.from(node.attributes);
    attrs.forEach((attr) => {
      /**
       * 处理 vue 的指令:
       * v-on:click="sayHello"   =>   {name: v-on:click, value: sayHello}
       * v-text="hello"          =>   {name: v-html, value: hello}
       */
      const { name, value } = attr;
      if (name.startsWith("v-")) {
        // v-on:click => [v-on, click]   v-text => [v-text]
        const [directiveName, type] = name.split(":");
        const [, directive] = directiveName.split("-");
        Utils[directive](node, value, this.vm, type);
      }
    });
  }

  // 编译文本节点
  compileText(node) {
    const content = node.textContent;
    const reg = /\{\{.+?\}\}/gi;
    if (reg.test(content)) {
      // 处理 {{}} 插值语法
      Utils.content(node, content, this.vm);
    }
  }

  // 将元素全部移入到内存中
  node2fragment(container) {
    const frgmt = document.createDocumentFragment();
    let node = container.firstChild;
    while (node) {
      frgmt.appendChild(node); // appendChild 会移除原来的元素
      node = container.firstChild; // 也就是说这个 node 依次为 第1,2,3...n个元素
    }
    return frgmt;
  }
}
