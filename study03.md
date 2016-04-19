scope的继承

为child新建一个constructor function。

```javascript
Scope.prototype.$new = function() {
  var ChildScope = function() {};
  ChildScope.prototype = this;
  var child = new ChildScope();
  return child;
};

```

或者是

```javascript
Scope.prototype.$new = function() {
  return Object.create(this);
};
```

angular的attribute shadowing就是来源于它的prototype继承方法。

儿子的属性会遮蔽爸爸的。

所以在child上要有点。
As phrased by Miöko Hevery, "Whenever you use ngModel, there’s got to be a dot in there somewhere. If you don’t have a dot, you’re doing it wrong."

