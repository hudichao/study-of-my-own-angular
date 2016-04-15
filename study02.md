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


