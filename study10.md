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













