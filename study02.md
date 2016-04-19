scope 的作用
+ 在controller和view之间共享数据
+ 在app的各个部分共享数据
+ 广播和监听事件
+ watch数据的变化

angular使用脏值检测来完成第四条

以下实现四个主要功能

+ $watch $digest $apply
+ scope继承
+ array和object的脏值检测
+ 事件系统 $on $emit $broadcast


用$watch给scope添一个watcher。



$digest会遍历所有watcher。并执行他们的watch和listener函数。

实现scope

发现几点。

1. scope上的绑定不会对性能有影响。因为angular会遍历watches，而不是scope上的
属性
2. 每次$digest，每个watcher都会被执行。所以watcher的数量是关键。

我们希望第一次digest一定触发listener。所以加了一个空函数。这样不可能赋值和它相同。

但是我们又不希望第一次返回这个空函数（内存泄露），所以对第一次，oldVal和newVal返回相同值

当scope被digest时获得提醒。

watcher如果有返回值，就会有dirty check。

dirty时保持digest。我们需要在watch的值停止变化前不断遍历所有watcher。

避免无限遍历。

每一轮减少遍历的watch的方法，记录最后一个dirty的watch，然后遇到clean watch后，判断是否是那个最后dirty的watch。如果是，说明
这轮已经结束，没有watch是dirty的。这样不需要走完全部。

显式return false来跳出lodash的forEach循环


特殊情况：在listener中加watch的情况。

判断值的变化。


还需要处理NaN，因为NaN不等于自己，导致会一直dirty。对于value based检查，因为用了lodash的isEqual已经处理了，
对于reference based 检查，我们需要自己做。

$eval的使用

$apply：将外部的代码带入digest cycle

$apply传入一个参数，用$eval执行这个函数，并触发$digest

$evalAsync -- 延迟执行

$timeout会延迟处理一个函数然后执行$apply

而$evalAsync可以在当前这个digest中延迟执行函数。

我们不需要浏览器反复渲染。


确保不dirty时，evalAsync的函数也在当前digest中执行。所以要改变终止条件。并且确保$evalAsync是有遍历次数限制。

需要确保$evalAsync能触发一个digest。而不是等待别的东西触发digest。后面有用$applyAsync。那个更好。

我们需要scope有一个phase，来确定现在是否在digest中。

合并$apply : $applyAsync
evalAsync主要还是被用在digest内部的defer work。
和$apply不同，$applySync不会马上执行函数，但会在很快的时间里执行。主要用途HTTP请求。如果用apply,没一个HTTP请求都会触发一个digest。

$applyAsync和$evalAsync的区别是，$applyAsync永远会延迟运行到下一个digest中，哪怕在当前digest中执行。

合并$applyAsync。我们要保证多个$applyAsync只会触发一个digest

如果digest已经在执行了，那要取消$applyAsync的digest。并且在那个digest做完$applyAsync的事情。

注意使用了_.bind语法。

在digest后执行函数 $$postDigest 。注意和$evalAsync和$applyAsync不同。不会发生digest。

只会执行一次。

错误处理。

watch的移除

因为会在_.forEach中对数组数量进行操作。所以用unshift代替push，并从尾部开始循环。

解决因为短循环，造成的watch清除时的bug。

最后考虑在一个watch中移除多个watch的情况。防止undfined的报错。










