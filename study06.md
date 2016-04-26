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

e相关的，本来js就支持，直接让js搞就行了。

但是这样会导致parse一些不该parse的 ---> 导入exp operator

parse 字符串

需要AST compiler 能 escape 字符串。

需要对起始和结束引号更严格。

两种需要支持的escape character。

新行 \n 
form feed \f
carriage return \r
horizontal tab \t
verical tab \v
单引号 \'
双引号 \"

unicode escape character 。以\u开头的四字16进制字符。

步骤：
看/后面是不是u，如果是，去后面4个字符。把它们parse成16进制数字。通过内置String.fromCharCode，转换为字符。







