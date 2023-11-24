/**
 * @description: 获取两个数组之间不同的元素
 * @param { Array } arr1 需要获取不同元素的数组一
 * @param { Array } arr2 需要获取不同元素的数组二
 * @return { Array } 两个数组之间不同的元素组成的数组
 */
/**
 * filter 数组的参数
 * element
 * 数组中当前正在处理的元素。
 * index
 * 正在处理的元素在数组中的索引。
 * array
 * 调用了 filter() 的数组本身。
 */
// indexOf() 方法返回数组中第一次出现给定元素的下标，如果不存在则返回 -1。
// lastIndexOf() 方法返回数组中给定元素最后一次出现的索引，如果不存在则返回 -1。该方法从 fromIndex 开始向前搜索数组。
const arrDifference = (arr1, arr2) => arr1.concat(arr2).filter((v, i, arr) => arr.indexOf(v) === arr.lastIndexOf(v));

// const getDifferentElements = (arr1, arr2) => {
//   const set1 = new Set(arr1);
//   const set2 = new Set(arr2);

//   const difference1 = [...set1].filter((element) => !set2.has(element));
//   const difference2 = [...set2].filter((element) => !set1.has(element));

//   return [...difference1, ...difference2];
// };

/** 用法
const arr1 = [1,2,4,5,8]
const arr2 = [2,3,5,8,9]
const result = arrDifference(arr1,arr2)
console.log(result) //=> [1,4,3,9]
*/
export default arrDifference;
