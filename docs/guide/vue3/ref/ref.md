# ref 源码的学习

通用步骤
进来先调用 一个函数 createRef

```js
function ref(value?: unknown) {
  return createRef(value, false);
}
function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}
// 这个是用来区分ref shallowRef 与 ref 不同，shallowRef 主要用于创建一个浅响应式引用，这意味着只有引用本身被视为响应式，而引用对象内部的属性不会被追踪。
// 这样，当引用对象内的属性发生变化时，不会触发视图更新。只有当引用本身被修改为新的对象时，才会触发更新。
function createRef(rawValue: unknown, shallow: boolean) {
  // 先判断是否是 Ref 类型 如果是的话直接return
  if (isRef(rawValue)) {
    return rawValue;
  }
  // ref的话  shallow为false
  // 这里是一个类
  return new RefImpl(rawValue, false);
}
```

![ref原值](https://rzjjj-1314320077.cos.ap-beijing.myqcloud.com/1700808677604.png?q-sign-algorithm=sha1&q-ak=AKIDjMQqBa6SXxZZvz2R32slkDv8-EMLc60CyZxO6ALN9uGlzisAd94sfGocffFprmQy&q-sign-time=1700808969;1700812569&q-key-time=1700808969;1700812569&q-header-list=host&q-url-param-list=ci-process&q-signature=d2c84380a0ed11633f1734ae297479148d26ef25&x-cos-security-token=D4eKVsRQMUzBMjj36P3QZ5NOT7WenNIa8c0daad9fad60782e27a45e5cc5441f3JkqtmzghbQrJrJqFbl4QJUS-ju8Sm6TsuxLi2N8TuxB_kS22EOnu-e6cu3MPQTct-dxJLWJHEy0NPohlXOT_z9rM_0ZfEIyAE624uuZSbjWfR-Oz_yyfgj6HUW8jCcZlqdovIKF7BDRrNHpRhQcDV7nK0ZW1St9LiWSbrcPqA5kpu5Ov4yH35eyUw6tUe_8b&ci-process=originImage)

然后通过一个类，来创建一个 ref 值

这里通过泛型 T 来推断类型

```typescript
function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW];
  return raw ? toRaw(raw) : observed;
}
const toReactive = <T extends unknown>(value: T): T => (isObject(value) ? reactive(value) : value);
```

```typescript
class RefImpl<T> {
  private _value: T;
  private _rawValue: T;

  public dep?: Dep = undefined;
  public readonly __v_isRef = true;

  constructor(value: T, public readonly __v_isShallow: boolean) {
    // 在这里存储初始值用来在set方法的时候对比
    //
    this._rawValue = __v_isShallow ? value : toRaw(value);
    // 存储值去看是否需要转换为reactive， 如果是对象的话就转换为reactive
    this._value = __v_isShallow ? value : toReactive(value);
  }

  get value() {
    console.log(this);
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    console.log(newVal);
    // __v_isShallow  false  false false
    const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal);
    newVal = useDirectValue ? newVal : toRaw(newVal);
    //   export const hasChanged = (value: any, oldValue: any): boolean =>
    // Object.is() 静态方法确定两个值是否为相同值。
    // // !Object.is(value, oldValue)
    // _rawValue 这里是初始值 对比一下
    if (hasChanged(newVal, this._rawValue)) {
      //对比一下 如果有变化，就更新初始值
      this._rawValue = newVal;
      // 必须在判断一下
      this._value = useDirectValue ? newVal : toReactive(newVal);
      triggerRefValue(this, newVal);
    }
  }
}
```

## debugger ref 的 set 方法

```typescript
const hasChanged = (value: any, oldValue: any): boolean => !Object.is(value, oldValue);
```

`Object.is` 是一个用于比较两个值是否相等的方法。与 `===` 运算符不同，`Object.is` 具有一些特殊的行为。

`Object.is` 的比较规则如下：

1. 如果两个值都是相同的对象引用，则它们被视为相等。
2. 如果两个值都是 `NaN`，它们被视为相等。
3. 如果两个值都是 `+0` 或 `-0`，它们被视为不相等。
4. 对于所有其他值，它们被视为不相等。

这与 `===` 运算符的行为不同，因为 `===` 不会区分 `+0` 和 `-0`，也不会将 `NaN` 视为与自身不相等。

示例：

```javascript
Object.is(1, 1); // true
Object.is("foo", "foo"); // true
Object.is({}, {}); // false, 不同的对象引用
Object.is(+0, -0); // false, +0 和 -0 被视为不相等
Object.is(NaN, NaN); // true, NaN 被视为相等
```

总的来说，`Object.is` 提供了一种更严格和准确的值比较方式，特别是在处理特殊值（`NaN`、`+0`、`-0`）时。但需要注意，它并不是在所有情况下都是必要或合适的。在一般情况下，使用 `===` 运算符通常已经足够。
