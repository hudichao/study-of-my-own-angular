查属性
nonComputedMember a.b 而不是a[b]


当undefined时，不抛错

在compiler里加一个if判断.


原来push能.push(1,2,3)这样push多个值的。

另一个helper function assign就是赋值。

再一个helper function，生成id的，因为有很多变量时需要加在后面加id，这里用自增的index

因为js的变量会hoist，所以把变量声明放在外面更好存在vars数组中