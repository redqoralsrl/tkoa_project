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
    res.render('register');
 
});

// 회원가입
router.post('/',(req,res)=>{
    console.log('회원가입 진행');
    const body = req.body;
    const id = body.id;
    const name = body.name;
    const pw = body.pw;
    const pw2 = body.pw2;
    const address = body.postcode + '_' + body.road_address + '_' + body.attend_address;

    const pass_cry = crypto.createHash('sha512').update(pw).digest('base64');
    client.query('select * from userdb where id=?',[id],(err,data)=>{
        if(data.length == 0){
            client.query('insert into userdb(id,name,pw,address) values(?,?,?,?)',[
                id, name, pass_cry, address
            ]);
            res.redirect('/');
        }else{
            console.log('데이터 삽입 실패');
            res.redirect('/');
        }
    },(err)=>{
        console.log(1);
        console.log(err);
    });

});

router.post('/checkID',(req,res)=>{
    console.log('ajax로 호출');
    let id_data = req.body.data;
    client.query('select * from userdb where id=?',[id_data],(err,data)=>{
        console.log(data.length);
        if(data.length == 0){
            res.send({
                result : true
            });
            console.log('사용가능');
        }else{
            res.send({
                result: false
            });
            console.log('사용불가능');
        }
    })
});

router.post('/checkName',(req,res)=>{
    console.log('ajax로 호출');
    let name_data = req.body.data;
    client.query('select * from userdb where name=?',[name_data],(err,data)=>{
        console.log(data.length);
        if(data.length == 0){
            res.send({
                result : true
            });
            console.log('사용가능');
        }else{
            res.send({
                result: false
            });
            console.log('사용불가능');
        }
    })
});

module.exports = router;