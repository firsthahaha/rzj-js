/**
 * @description:删除数组中的重复项
 * @param { Array } arr 目标去重的数组
 * @return { Array } 数组去重后的结果
 */
const arrWithoutDupli = (arr) => [...new Set(arr)];

// indexOf() 方法返回数组中第一次出现给定元素的下标，如果不存在则返回 -1。
// const uniqueArray = (arr) => arr.filter((value, index, self) => self.indexOf(value) === index);

// const uniqueArray2 = (arr) => arr.reduce((unique, item) => (unique.includes(item) ? unique : [...unique, item]), []);

/** 用法

  const fruits = ["apple", "mango", "orange", "apple", "pineapple", "pineapple", "peach", "mango"]
  let result = arrWithoutDupli(fruits);
  console.log(result) // ['apple', 'mango', 'orange', 'pineapple', 'peach']

 */

export default arrWithoutDupli;
