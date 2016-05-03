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
