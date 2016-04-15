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