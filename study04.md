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