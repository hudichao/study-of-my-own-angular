### 创建$watchCollection

这里的图讲的很清楚了。

把newVal, oldVal放在intervalWatchFn和internalListenerFn外，在不同的digest cycle中保持persist。

return 一个counter，oldVal和newVal不同时，counter++，那对watch来说就是不同的值了。

防止NaN时的bug。

### 发现新数组

### 发现数组中添加或移除的项目

### 发现数组中reorder或替换的项目

再一次NaN的bug修正

### 像array的object

比如arguments， DOM NodeList

测试失败，是因为Lodash的_.isArray，所以我们创建自己的。

### object

lodash
.forOWn遍历object自身属性，排除从原型链继承的属性。

处理属性的值为NaN的情况

对OldVal遍历一遍，和新的比较，来确定新的有没有少属性。

### 减少不必要的object 遍历

### 处理有length属性的object

需要保证listener函数中的oldValue正确，所以加一个veryOldValue。传给listener函数，而且只当显式声明有它时才需要。

保证第一次时oldValue返回newValue