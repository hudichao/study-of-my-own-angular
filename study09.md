### filter

filter的注册先这样。以后有DI之后在改。

### filter expression

filter的东西都要在runtime时加的。

.nexId根据是否skip，来决定是否变量声明

否则会有变量遮蔽。

42 | increment
会生成

```javascript
function(ensureSafeMemberName, ensureSafeObject, ensureSafeFunction,
         ifDefined,  lter) {
  var v0 =  fllter('increment');
  var fn = function(s, l) {
  var v0;
  return v0(42);
  };
  } return fn;
```

将AST.prototype.filter中的if改为while，即能支持chained filter。

使用|something:2 的形式给filter传入第二个参数

### 实现angular的filter filter
通过函数的filter直接使用lodash的_.filter即可。

对nested array和nest object 的filter

用其他primitive filter

注意数字filter会filter数字的string。即filter:42 会filter出'42'

undefined 和 null的特殊处理

### 否定的filter
通过prefix的!

### 通过object filter

1.第一步
注：用_.toPlainObject来保证继承的property也会检查。
2.第二步
忽略undefined
这个compare有点通用的其实到这里为止。
3.第三步
如果有nested array，如果这个nested array中的任何一项match，就match
4.第四步
对于primitive， 需要只对同一level的进行匹配

注意_.every中matchAnyProperty默认为false

### Object Wildcards
$: 表示任意property

还需要支持primitive的情况。这个时候使用者干嘛还用wildcard。唉。

还需支持nested wild card

### filter with custom comparators

全等flag

### 总结

• That filters are applied to expressions using the pipe operator |.
• That Angular expressions don’t support bitwise operators, and that the bitwise OR would con-
flict with the filter operator.
• That filters are registered and obtained using the  lter service.
• How you can register several filters in bulk by giving the filter service an object.
• How filter expressions are processed as call expressions by the AST builder and compiler.
• That filter expressions have the lowest precedence of all expressions.
• How the AST compiler generates JavaScript code to look up all the filters used in an expression
from the filter service at runtime.
• How several filter invocations can be chained.
• How additional arguments can be passed to filters, and how they’re given to the filter function
as the second, third, etc. arguments.
• How the built-in filter filter works: With predicate functions, primitives, or objects as the filter
expression. With nested objects and arrays. With wildcard $ keys, and with custom compara- tors.


