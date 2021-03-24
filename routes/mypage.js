const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const momment = require('moment');

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
    client.query('select * from wallet where name=? order by num desc;select * from suc where name=? order by num desc;select * from userdb where name=?;',[req.session.name,req.session.name,req.session.name],(err,data)=>{
        // console.log(data);
        let datas = data[0];
        let tt = data[1];
        let mon = data[2];
        res.render('mypage',{
            logined: req.session.logined,
            id: req.session.id,
            name: req.session.name,
            address: req.session.address,
            money: mon[0].money,
            wallet: datas,
            momment: momment,
            tt: tt
        });
    }); 
});

router.post('/insert',(req,res)=>{
    console.log('ajax로 호출');
    console.log(req.body.data,'충전');
    let moneys = req.body.data;
    moneys = Number(moneys);
    const name = req.session.name;
    client.query('select * from userdb where name=?',[name],(err,data)=>{
        let result = moneys + data[0].money
        console.log('ajax 조회');
        console.log(result);
        req.session.money_be = moneys;
        req.session.save();
        client.query('update userdb set money=? where name=?',[
            result, name
        ],(err,data)=>{
            console.log('ajax 삽입');
            req.session.money = result;
            req.session.save();
            client.query('INSERT INTO wallet(NAME, money_history, doit) VALUES(?,?,?);',[
                name, req.session.money_be, '입금'
            ],(err,data)=>{
                if(err) console.log(err);
                res.send({
                    result: true
                });
                console.log('입금완료');
            });
            
        });
    });
});

router.post('/output',(req,res)=>{
    console.log('ajax로 호출');
    console.log(req.body.data,'출금');
    let moneys = req.body.data;
    moneys = Number(moneys);
    const name = req.session.name;
    client.query('select * from userdb where name=?',[name],(err,data)=>{
        if(moneys > data[0].money){
            res.send({
                result: false
            })
        }else{
            let result = data[0].money - moneys
            console.log('ajax 조회');
            console.log(result);
            req.session.money_be = moneys;
            req.session.save();
            client.query('update userdb set money=? where name=?',[
                result, name
            ],(err,data)=>{
                console.log('ajax 삽입');
                req.session.money = result;
                req.session.save();
                client.query('INSERT INTO wallet(NAME, money_history, doit) VALUES(?,?,?);',[
                    name, req.session.money_be, '출금'
                ],(err,data)=>{
                    if(err) console.log(err);
                    res.send({
                        result: true
                    });
                    console.log('출금완료');
                });
                
            });
        }
        
    });
    

});

module.exports = router;