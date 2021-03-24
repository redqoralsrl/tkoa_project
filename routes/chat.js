const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');


// router 설정
const router = express.Router();

const client = require('./mysql');

// 정적파일 설정 (미들웨어)
router.use(express.static(path.join(__dirname,'/routes')));
router.use(express.static(path.join(__dirname,'/public')));

// 정제 (미들웨어)
router.use(bodyParser.urlencoded({extended:false}));

// 세션 (미들웨어)
router.use(session({
    secret: 'blackzat', // 데이터를 암호화 하기 위한 필요한 옵션
    resave: false, // 요청이 왔을 때 세션을 수정하지 않더라도 다시 저장소에 저장을 막기
    saveUninitialized: true, // 세션이 필요할 때 세션을 실행시킨다(서버에 부담을 줄인다)
    // store: new FileStore() // 세션 데이터를 파일에 저장한다
}));

router.get('/',(req,res)=>{
    if(req.session.logined == true){
        res.render('chat',{
            // 보낼 정보
            logined: req.session.logined,
            id: req.session.id,
            name: req.session.name,
            address: req.session.address,
            money: req.session.money,
        });
    }
});


module.exports = router;