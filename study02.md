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



