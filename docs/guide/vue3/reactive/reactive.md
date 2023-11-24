# 读 reactive 源码

```js
// 使用reactive创建一个响应式对象
const peopleMes = {
  name: "James",
  age: "39",
};
```

会执行 reactive 函数 进来会先判断是不是只读的
如果是只读的会直接返回原 target
如果不是只读的， 就会走另一个函数 createReactiveObject()

```js
function createReactiveObject(target: Target, isReadonly: boolean, baseHandlers: ProxyHandler<any>, collectionHandlers: ProxyHandler<any>, proxyMap: WeakMap<Target, any>) {}
// WeakMap 对象是一组键/值对的集合，其中的键是弱引用的。其键必须是对象，而值可以是任意的
// Map 的区别
// Map 的键可以是任意类型，WeakMap 的键只能是对象类型
// WeakMap 键名所指向的对象，不计入垃圾回收机制
```

进来会判断是否是对象如果不是对象就 return 出去原本的值

```js
// null 如果使用typeof 也会变成对象
const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'
```

如果这个 reactive 是被这个处理过的，就直接返回原本的

这里就是为什么要使用 weakMap 的原因了
Map 的键可以是任意类型，WeakMap 的键只能是对象类型

保持私有性： WeakMap 中存储的键值对是弱引用的。这意味着当键不再被引用时，键值对会被自动回收。在 Vue 3 中，这一点很重要，因为它允许在组件实例销毁时自动释放内部私有状态，而不会造成内存泄漏。
不影响垃圾回收： 使用 WeakMap 存储私有状态，可以避免在 Vue 组件销毁时手动清理状态。由于 WeakMap 的键是弱引用，不会阻止相关对象被垃圾回收。
不可追踪： WeakMap 的键是不可追踪的，这意味着外部代码无法访问或遍历 WeakMap 中的键。这有助于确保 Vue 内部的状态对外部是不可见的，从而维护框架的封装性。
避免内存泄漏： 由于 WeakMap 的键是弱引用，如果一个 Vue 组件实例被销毁，与之关联的私有状态也会被自动释放，而不会导致内存泄漏。

```js
const existingProxy = proxyMap.get(target);
if (existingProxy) {
  return existingProxy;
}
```

然后在判断
Object.isExtensible() 静态方法判断一个对象是否是可扩展的（是否可以在它上面添加新的属性）。
这段代码似乎是与 Vue.js 或类似框架相关的响应式系统或状态管理系统的一部分。让我逐步解释主要组件及其目的：

1. **`getTargetType` 函数：**

   - 接受一个类型为 `Target` 的参数 `value`。
   - 检查 `value` 对象中是否存在 `ReactiveFlags.SKIP` 属性，或者对象是否不可扩展（`Object.isExtensible(value)` 为 `false`）。
   - 如果任一条件为真，则返回 `TargetType.INVALID`。
   - 否则，调用 `targetTypeMap` 函数，参数为 `toRawType(value)` 的结果。

2. **`targetTypeMap` 函数：**

   - 接受一个 `rawType` 参数，该参数是一个字符串。
   - 使用 `switch` 语句将 `rawType` 映射到特定的 `TargetType`。映射基于常见的 JavaScript 类型，例如 "Object" 或 "Array"，还包括对集合类型如 "Map" 或 "Set" 的处理。
   - 如果 `rawType` 不匹配任何情况，则返回 `TargetType.INVALID`。

3. **`toRawType` 函数：**
   - 接受一个 `unknown` 类型的值。
   - 使用 `toTypeString` 函数（在提供的代码片段中未提供）获取类型的字符串表示，通常为 "[object RawType]" 形式。
   - 通过 `slice(8, -1)` 从该字符串中提取 "RawType" 并返回它。

该代码的总体目的似乎是确定响应式系统中给定值的类型，将其分类为常见类型（`TargetType.COMMON`）、集合类型（`TargetType.COLLECTION`），或标记为无效类型（`TargetType.INVALID`）。`ReactiveFlags.SKIP` 和可扩展性检查表明可能存在对某些对象类型的特殊处理，以优化响应性。这种逻辑通常出现在处理响应式编程或状态管理的系统中，尤其是在 Vue.js 等框架的上下文中。

```js
// 用来 handler的方法不同
const proxy = new Proxy(target, targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers);
proxyMap.set(target, proxy);
// 往整体的里面设置代理的对象
```
