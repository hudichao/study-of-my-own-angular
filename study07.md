查属性
nonComputedMember a.b 而不是a[b]


当undefined时，不抛错

在compiler里加一个if判断.


原来push能.push(1,2,3)这样push多个值的。

另一个helper function assign就是赋值。

再一个helper function，生成id的，因为有很多变量时需要加在后面加id，这里用自增的index

因为js的变量会hoist，所以把变量声明放在外面更好存在vars数组中


### parse this

一个问题看了半小时没看出来。最后发现是因为case AST.Identifier:中写死return "v0"了

#### 多层

产生这样的ast


{
    type: AST.Program,
    body: {
        type: AST.MemberExpression,
        property: {
            type: AST.Identifier,
            name: 'fourthKey'
        },
        object: {
            type: AST.MemberExpresion,
            property: {
                type: AST.Identifier,
                name: 'thirdKey'
            },
            object: {
                type: AST.MemberExpression,
                property: {
                    type: AST.Identifier,
                    name: 'secondKey'
                },
                object: {
                    type: AST.Identifier,
                    name: aKey
                }
            }
        }
    }
}

返回这样的函数

```javascript
function(s) {
  var v0,v1,v2,v3;
  if (s) {
    v3 = s.aKey;
  }
  if (v3) {
    v2 = v3.secondKey;
  }
  if (v2) {
    v1 = v2.thirdKey;
  }
  if (v1) {
    v0 = v1.fourthKey;
  }
  return v0;
}
```

### locals

第二个传参，优先看这个locale object。 比如ng-click就用到了$event

local有值就用local。


### computed attribute

### function calls
我们还要触发函数

function callss 由primary ast nodes处理，就和property access一样。在ast.primary的while循环
中，当看到(时，生成CallExpression node。并把之前的primary表达式设为callee(即要执行的function)

生成ast是，我们要parse所有括号内的参数。parseArguments方法：和读取array中的literal方法一样，除了不支持尾逗号。
在compile时候，recurse每个参数，并将结果放到数组中。

又发现自己一个傻逼地方。在test里面没写关闭的括号，导致把this.consume(")")去掉竟然过了。。

### method call

已method方式被执行的function call。注意this。

关于这个的所有的处理都在AST compiler下。
关键：引入一个call context object。

callContext包含属性：
+ context: 这个method所属的object，最终会是this
+ name: 这个method的property名字
+ computed: 这个方法是否是通过computed property获得

其实返回的就是(v1)["aFunction"]()和(v1).aFunction()
而不再是返回v0()(v0 = (v1)['aFunction'] 等


对于非method的普通函数调用。

this指向scope

生成Identifer expression的context
这个context是l或者s, name是identifer name
computed恒为false

最后return (l && ('aFunction' in l) ? l: s).aFunction && (l && ('aFunction' in l) ? l: s).aFunction();
这种

### 数据赋值
assignment不属于AST.primary，

assignment可以替代现在的primary，如果没等号，效果和原primary一样。

### 自己生成属性
又是自己test写错了。nest没加引号

### 更安全的member access
如果什么都不做
aFunction.constructor("return window;")()
能返回window，无论你实际aFunction写的是什么。因为我们用了new Function
除了constructor，以下的这些也有不可预知的问题
__proto__ [非标准的获取和设置全局prototype]("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto")
__defineGetter__,__lookupGetter__,__defineSetter__,__lookupSetter。[非标准的定义object的property]("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/__defineGetter__")

对于non-computed member，因为我们在parse的时候不知道property的名字，所以需要在runtime，当每次表达式执行时调用ensureSafeMemberName函数。





改正了一个bug。这个bug导致所有带_或$的都不被认为是identifier

