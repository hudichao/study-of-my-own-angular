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

### and or
有意思的地方是和js一样，如果前面已经是false后面的表达式不会求值。or类似。

and优先级比or高。

实现方法：都是套路。新建一个LogicalExpression虽然实际它是BinaryExpression

c = a && b
第一步 c = a
如果a是true c = b return c
如果a是false return c

d = a || b
第一步 d = a 
如果!a是true d = b return d
如果!a是false return d

### 三元operator
本章最后一个operator。
三元优先级比or低。

和本章之前不同，我们不在operator函数中实现。因为有两个operator ？和 :
所以在AST building中检测更方便。

看AST builder方法被执行的顺序的倒序即为operator的顺序
1. Primary expressions: Lookups, function calls, method calls.
2. Unary expressions: +a, -a, !a.
3. Multiplicative arithmetic expressions: a * b, a / b, and a % b.
4. Additive arithmetic expressions: a + b and a - b.
5. Relationalexpressions:a<b,a>b,a<=b,anda>=b.
6. Equality testing expressions: a == b, a != b, a === b, and a !== b. 7. Logical AND expressions: a && b.
8. Logical OR expressions: a || b.
9. Ternary expressions: a ? b : c.
10. Assignments: a = b.

### 括号改变优先级
实现方法：改primary

### 多个statement

### 本章结束

下一章filter。filter是唯一主要的angular有，js没有的东西。

