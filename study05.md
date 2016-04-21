### scope events

### publish-subscribe messaging

在scope上publish event。其他地方，subscribe来接受这个event。

作为publish的人，它不知道有多少人接受event。作为subscriber，你不知道event哪里来。

scope来解耦publisher和subscriber。

往上层（包含自己）发event：emit
往下层（包含自己）发event：broadcast

### $on
注册event listener

是无法区分event是emit还是broadcast来的事件的。

保存$$listeners

一个典型的listener

需要每个scope有一个$$listeners

一句话搞定。

### $emit和$broadcast

运行原理是，$emit或broadcat时，触发所有注册这个event的listener。

### Event object

给listener传的event object有name。

jasmine spy的calls.mostRecent().args 代表最后一次运行的传参。

需要保证给不同listener传的event是同一个。

### 其他listener参数

LODASH的_.rest(arguments)返回除了第一个之外的函数arguments所组成的array

concat合并数组 [a].concat([b,c]) -> [a,b,c]
使用apply将新的listenerArgs传到listener里去。
否则传参就是一个数组了。


一个坑。新的LODASH的_.rest变了，应该改为用_.tail

取消注册。
解决由于splice后数组长度变短，导致之后的那个listener不执行问题。
解决方法：不再用splice，直接设为null。