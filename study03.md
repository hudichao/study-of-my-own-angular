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

seperated watches
现在实现是，所有的$$watchers数组都是存在Scope走好难过的，所以无论在哪个scope digest。我们都会digest所有的。
我们希望只digest自己和儿子的watch。
方法是，每个scope都由自己的$$watchers数组。通过遮蔽爸爸的方式。


Recursive Digestion
我们需要能digest儿子的watch。我们需要改digest。

首先我们需要让scope知道自己有哪些$$children.

然后要能digest自己儿子。创建一个$$everyScope, 在每一个scope上执行function。
更改$$digestOnce, $$lastDirtyWatch还是指向rootScope的。

对$apply, $evalAsync, $applyAsync同样。
能够触发顶层的digest。所以需有一个$root属性。
