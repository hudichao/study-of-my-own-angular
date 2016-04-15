创建 .jshint 
打开browser, browserify 和 devel 环境

./node_modules/jshint/bin/jshint src 跑测试

改scripts来跑 npm run lint

使用jasmine, sinon, karma做单元测试

Karma是test runner

npm install --save-dev jasmine-core sinon

npm install --save-dev karma karma-jasmine karma-jshint-preprocessor

npm install --save-dev phantomjs-prebuilt karma-phantomjs-launcher


新建karma.config.js

使用commonjs，一个文件一个module

我们用commonjs规范写代码，然后用browserify来打包中可以在浏览器运行的js
npm install --save-dev browserify karma-browserify

更新karma.conf.js

我们打开browserfiy的debug来使用source map。

