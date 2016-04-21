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
