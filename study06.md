rough实现

```javascript

function parse(expr) {
    return function(scope) {
        with (scope) {
            return eval(expr);
        }
    }
}
```

本书只支持complied mode。不支持html content security policy.

lexer -> ast builder -> ast compiler -> parser

lexer: "a+b" => a,+,b

ast(abstract syntax tree)

W054: JSHint warning code 『the function constructor is a form of eval』

在lex中加一个peek函数，读取下一个char的值

