### 创建$watchCollection

这里的图讲的很清楚了。

把newVal, oldVal放在intervalWatchFn和internalListenerFn外，在不同的digest cycle中保持persist。

return 一个counter，oldVal和newVal不同时，counter++，那对watch来说就是不同的值了。

防止NaN时的bug。

### 发现新数组

