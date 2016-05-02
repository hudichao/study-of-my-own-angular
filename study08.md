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

加减法对于undefined，设为0

### 比较大小

算数大小，和两种相等

这两个中，算数大小优先。

2 == "2" > 2 === "2"按照正确的顺序应该是

2 == false === "2"

false === "2"

false

如果顺序错的话,

true > false
1 > 0
true

根据ECMA，true被强制转换1，false被强制转换0

这两个的优先级都被加法低。

实现：一个equaltiy和relational方法，因为这两个不同的优先级，所以得有两个方法。因为算数大小优先，所以equality里用relational（算数大小）

还要更改Lexer.lex，来支持多字符的operator。目前为止都是一个字符的。

先看后三个字符是不是operator，然后是后两个，最后是后一个。

目前lexer看到第一个=时，就不看后面的了。(为了上一章的赋值)得改。

