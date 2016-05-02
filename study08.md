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

### 乘除

AST新的方法 multiplicative

顺序

不断笑话multiplicative中的token，直到没有operator。因为所有multiplicative拥有相同的优先级，所以从左到右执行。

### 加减






