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


