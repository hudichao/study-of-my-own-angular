### scope events

### publish-subscribe messaging

在scope上publish event。其他地方，subscribe来接受这个event。

作为publish的人，它不知道有多少人接受event。作为subscriber，你不知道event哪里来。

scope来解耦publisher和subscriber。

往上层（包含自己）发event：emit
往下层（包含自己）发event：broadcast

