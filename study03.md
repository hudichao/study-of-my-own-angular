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