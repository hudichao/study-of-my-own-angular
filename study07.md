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

