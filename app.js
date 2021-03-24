const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// 정적파일 설정 (미들웨어)
app.use(express.static(path.join(__dirname,'routes')));
app.use(express.static(path.join(__dirname, 'public')));
// 세션 (미들웨어)
app.use(session({
  secret: 'blackzat', // 데이터를 암호화 하기 위한 필요한 옵션
  resave: false, // 요청이 왔을 때 세션을 수정하지 않더라도 다시 저장소에 저장을 막기
  saveUninitialized: true, // 세션이 필요할 때 세션을 실행시킨다(서버에 부담을 줄인다)
  // store: new FileStore() // 세션 데이터를 파일에 저장한다
}));

// 라우터 설정
const indexRouter = require('./routes/index');
app.use('/', indexRouter);
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const jongRouter = require('./routes/jong');
const gondongRouter = require('./routes/gondong');
const mypageRouter = require('./routes/mypage');
const helperRouter = require('./routes/helper');
const chatRouter = require('./routes/chat');
const tradeRouter = require('./routes/trade');
app.use('/login',loginRouter);
app.use('/register',registerRouter);
app.use('/jong',jongRouter);
app.use('/gondong',gondongRouter);
app.use('/mypage',mypageRouter);
app.use('/helper',helperRouter);
app.use('/chat',chatRouter);
app.use('/trade',tradeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// $ npm install socket.io 
// $ npm install serve-favicon 

app.io = require('socket.io')();
app.io.on('connection',function(socket){
  console.log('a user connected');
  socket.broadcast.emit('hi');
  socket.on('disconnect',function(){
    console.log('user disconnected');
  });
  socket.on('chatMessage',function(msg,name){
    app.io.emit('chatMessage',msg,name);
  });
})

module.exports = app;
