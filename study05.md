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

