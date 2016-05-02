算术
比较
boolean
比较等于
三元 
filter

### 一元operator

我们从优先级最高的开始写。

unary会生成UnaryExpression token。

ifDefined方法生成一个runtime JS call来执行ifDefined

parse !

parse -: 负数

解决字符串中的感叹号的bug

由于string token有一个text 属性，有一个值为!, 所以AST builder把它解释为unary ! operator。

解决方法：

包含前后引号




