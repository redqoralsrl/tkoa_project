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

// 연결


router.get('/',(req,res)=>{
    client.query('select * from toron order by num desc;',(err,data)=>{
        if(req.session.logined == true){
            res.render('gondong',{
                // 보낼 정보
                logined: req.session.logined,
                id: req.session.id,
                name: req.session.name,
                address: req.session.address,
                money: req.session.money,
                data: data
            });
        }else{
            res.render('gondong',{
                logined: false,
                data: data
            });
        }
    });
    
});


router.post('/',(req,res,next)=>{
    const body = req.body;
    const comment = body.board_con;
    const user_name = req.session.name;
    console.log(body);
    console.log(body.board_con);
    console.log(body.find);
    client.query('select * from toron order by num desc; insert into toron(company_src, name, comment, good) values(?,?,?,?);',[
        body.find, user_name, comment, 0
    ],(err,data)=>{
        if(err) console.log(err);
        console.log(data);
        res.redirect('/');
    });
});

router.get('/delete/:num',(req,res)=>{
    const num = req.params.num;
    client.query('select * from toron where num=?',[num],(er,result)=>{
        if(req.session.name == result[0].name){
            client.query('delete from toron where num = ?',[num],(err,data)=>{
                if(err) console.log(err);
                res.redirect('/');
            });
        }else{
            res.send('<script>alert("보안 작동!");history.back();</script>')
        }
        
    })
    
});

module.exports = router;