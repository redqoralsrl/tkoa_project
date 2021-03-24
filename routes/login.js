const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');

// router 설정
const router = express.Router();

// db 연결
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
    res.render('login');
});

router.post('/',(req,res)=>{
    console.log('로그인 진행');
    const body = req.body;
    const id = body.id;
    const pw = body.pw;
    const pass_cr = crypto.createHash('sha512').update(pw).digest('base64');
    client.query('select * from userdb where id=?',[id],(err,data)=>{
        if(err) console.log(err);
        if(data.length != 1){
            res.send('<script>alert("가입된 정보가 없습니다!");history.back();</script>');
        }else if(id == data[0].id || pass_cr == data[0].pw){
            console.log('로그인 성공');
            // 쿠키 추가
            // res.cookie(data[0].id,data[0].pw,{
            //     maxAge : 60 * 60 * 10
            // });
            // 세션 추가
            req.session.logined = true;
            req.session.id = data[0].id;
            req.session.pw = data[0].pw;
            req.session.name = data[0].name;
            req.session.address = data[0].address;
            req.session.money = data[0].money;
            req.session.save();
            client.query('select * from news; select * from toron order by num desc;',(err,data)=>{
                res.render('index',{
                    // 보낼 정보
                    logined: req.session.logined,
                    id: req.session.id,
                    name: req.session.name,
                    address: req.session.address,
                    money: req.session.money,
                    data: data[0],
                    toron: data[1]
                });
            });
        }else{
            res.send('<script>alert("입력하신 정보가 일치하지 않습니다!");history.back();</script>');
        }
    });
});


module.exports = router;