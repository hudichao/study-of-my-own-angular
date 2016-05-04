# Watching Expression

parse fuction返回该function本身

### literan and constant

[42, 'abc'] literal and constant
[42, 'abc', aVariable] literal but not constant

constant首先看number， string， boolean

allConstants = allConstants && xxx

this不能是constant，因为他的值是runtime scope

non-computed （obj.a这种）看object本身是不是constant
computed (obj["a"]这种) 需object以及key都是constant

函数的执行为false

一个特殊情况是filter中的函数调用。只要input expression是constant, 就是constant。（其实还有特例，本周回来继续）

assignment只有两边都是constant的时候才是constant，虽然没什么意义。


### 优化constant expression watching

constant expression都会返回同一个value。所以一旦这个constant expression被trigger，就再也不会dirty。即我们可以remove这个watch

创建一个watchDelegte来出来watchFn的生成

### one-time expression

one-time watching完全由parse.js处理。会有一个oneTimeWatchDelegate

oneTimeWatchDelegate只有在newVal不是undefined的时候才会unwatch。是为了对应那种ajax赋值情况。

不仅如此，还要保证只有当这个value稳定下来之后才remove，因为有可能在digest之间值为undefeind。
所以在digest结束时候钥匙undefined之外的值。

对于collection literal（如array或者object），one-time watch只有在其每一项都不是undefined的时候remove

已支持类似ngClass, ngStyle的配置。

p368的_.any应该为_.some




