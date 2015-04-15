//project entry


var path = require('path'),
    express = require('express'),
    app = express(),
    config = require('./config');

/*
**设置
*/

//端口
app.set('port', process.env.PORT || config.app.port);


//设置路由
app.enable('strict routing');


/*
**绑定路由
*/

//加载前台路由
require('./routers')(app)


/*
**启动服务
*/
app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
