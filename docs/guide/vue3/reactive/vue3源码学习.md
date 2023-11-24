# vue3源码学习
## reactive实现原理
>定义: 接收一个普通对象然后返回该普通对象的响应式代理。等同于 2.x 的 Vue.observable()
```js
const obj = reactive({ count: 0 })
// 响应式转换是“深层的”：会影响对象内部所有嵌套的属性。基于 ES2015 的 Proxy 实现，返回的代理对象不等于原始对象。建议仅使用代理对象而避免依赖原始对象
```
先判断是否是一个只读的，如果是只读的他会带一个标识 `__v_isReadonly`并且直接返回，如果不是会创建一个响应式对象
执行 createReactiveObject函数
```ts
createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
)
```
#### 扩展知识 WeakMap
> WeakMap 对象是一组键/值对的集合，其中的键是弱引用的。其键必须是对象，而值可以是任意的
> Map的区别
Map 的键可以是任意类型，WeakMap 的键只能是对象类型
WeakMap 键名所指向的对象，不计入垃圾回收机制
`Record<any, any>`：这是一个类型，表示一个具有任意键和任意值类型的对象。`Record` 是 TypeScript 内置的泛型类型，用于表示对象的键值对结构。
```ts
// 这个是为了类型推断和泛型支持
// 这里卡死了必须是objectreactive
export function reactive<T extends object>(target: T): UnwrapNestedRefs<T>
```
上来先判断是否是对象 (val !== null && typeof val === 'object')
如果不是，就警告

## ref实现原理
> ts扩展 
unique symbol 是声明一种特殊类型，创建独特且不可重复的
```` typescript
// 默认泛型为any类型
interface Ref<T = any> {
  value: T
  /**
   * Type differentiator only.
   * We need this to be in public d.ts but don't want it to show up in IDE
   * autocomplete, so we use a private Symbol instead.
   */
  [RefSymbol]: true
}
````
> 调用ref 方法 就是传入一个值
1. 创建一个Ref对象函数 
> ts扩展
unknown 类型用于表示未知类型的值，并要求在使用之前进行类型检查或类型转换，以确保代码的类型安全性。
```ts
function ref(value?: unknown) {
  return createRef(value, false)
}
```
2. 在这个函数中会判断ref是否是一个Ref对象，如果不是就创建一个Ref对象如果是的话，就把ref对象return出去，如果不是的话就new一个ref,这里写了一个Refclass
