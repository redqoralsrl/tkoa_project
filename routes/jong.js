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
    client.query('select * from company', (err,data)=>{
        if(req.session.logined == true){
            res.render('jong',{
                // 보낼 정보
                logined: req.session.logined,
                id: req.session.id,
                name: req.session.name,
                address: req.session.address,
                money: req.session.money,
                data: data
            });
        }else{
            res.render('jong',{
                logined: false,
                data: data
            });
        }
    })
});

// 관련 회사 거래 페이지 이동
router.get('/:company',(req,res)=>{
    console.log('거래페이지 작동');
    const company = req.params.company;
    // console.log(company);

    const sql = `select * from company where company_name='${company}';`;
    client.query(sql,(err,data)=>{
        // console.log(data);
        console.log('전송!');
        if(err) console.log(err);
        if(req.session.logined == true){
            res.render('deal',{
                // 보낼 정보
                logined: req.session.logined,
                id: req.session.id,
                name: req.session.name,
                address: req.session.address,
                money: req.session.money,
                com: data[0]
            });
        }else{
            console.log('전송완료!');
            res.render('deal',{
                logined: false,
                name : null,
                com: data[0]
            });
        }
    });
});

// 100% 버튼 미들웨어
router.post('/:company/money',(req,res,next) => {
    console.log('ajax 작동 100%버튼 처리');
    const company = req.params.company; // 회사
    console.log(company);
    const name = req.body.name; // 이름
    console.log(name);
    client.query('select money from userdb where name=?; select * from company where company_name=?',[
        name, company
    ],(err,data)=>{
        if(err) console.log(err);
        const userdb_data = data[0];
        const company_data = data[1];
        const user_money = userdb_data[0].money;
        const company_sold_money = company_data[0].sold_money; // 현재 모금액
        const company_price = company_data[0].company_price * company_data[0].company_count;
        const com = company_price - company_sold_money; // 남은 모금액 = 현재 전체모금액 - 모인모금액
        console.log('사용자 : ',user_money,'회사 모금액 : ',company_sold_money, '회사 주식 총가격 : ',company_price, '남은 모금액 : ',com);
        // 사용자 포인트가 남은 모금액보다 작거나 같을 경우
        if(user_money <= com){
            res.send({
                result : user_money
            })
        }else if(user_money > com){ // 사용자 포인트가 남은 모금액보다 많을 경우
            res.send({
                result : com
            })
        }else{ // 돈 없을경우
            res.send({
                result : 0
            })
        }
    })
});



// 구매 미들웨어 - 잔액 비교 확인
router.post('/:company/buy',(req,res,next)=>{
    console.log('ajax로 호출');
    const company = req.params.company; // 회사이름
    // console.log(company);
    const buy_jusick = req.body.data; // 사용자가 입력한 돈
    console.log(buy_jusick);
    client.query('select * from userdb where name=?;',[req.session.name],(err,data)=>{
        console.log(data[0].money, '아아아');
        console.log(typeof data[0].money);
        if(data[0].money < Number(buy_jusick)){
            res.send({
                result : 'wrong'
            });
            console.log('뒤로복귀');
        }else{
            next();
        }
    })
});
// 구매 미들웨어2 - 구매 응모 돈 확인
router.post('/:company/buy',(req,res,next)=>{
    console.log('미들웨어시작!');
    const company = req.params.company; // 회사이름
    // console.log(company);
    const buy_jusick = req.body.data; // 사용자가 입력한 돈
    // console.log(buy_jusick);
    client.query('select company_price,company_count, sold_money from company where company_name = ?',[
        company
    ],(err,data)=>{
        console.log(data);
        const datas = data[0];
        // console.log(typeof datas.sold_money, typeof buy_jusick);
        const total = datas.sold_money + Number(buy_jusick);
        const company_ju = datas.company_price * datas.company_count;
        console.log(total);
        console.log(company_ju);
        if(company_ju == datas.sold_money){
            res.send({
                result : 'soldout'
            });
        }else if(total > company_ju){
            res.send({
                result : 'over'
            });
            console.log('뒤로복귀');
        }else{
            next();
        }
    });
});
// 구매 미들웨어3 - 주식응모하고 포인트감소 회사 모금액 증가
router.post('/:company/buy',(req,res,next)=>{
    console.log('미들웨어2시작!');
    const company = req.params.company; // 회사이름
    // console.log(company);
    const buy_jusick = req.body.data; // 사용자가 입력한 돈
    // console.log(buy_jusick);
    const name = req.session.name;
    // console.log(name);
    const money = req.session.money;
    // console.log(money);
    client.query(`update userdb set money=? where name=?;update company set sold_money= sold_money + ${buy_jusick} where company_name =?;insert into buy(name,company_name,bought) values(?,?,?);insert into wallet(name, money_history, doit) values(?,?,?);`,[
        (money - Number(buy_jusick)), name, company, name, company, buy_jusick, name, buy_jusick, '매수'
    ],(err, data)=>{
        if(err) console.log(err);
        req.session.money = (Number(money) - Number(buy_jusick));
        req.session.save();
        res.send({
            result : 'success'
        });
        console.log('매수성공');
        next();
    });
});

// 구매 모집 100% 되었는지 확인하는 미들웨어4 - 모금액 100%시 주식 사는거 성공
router.post('/:company/buy',(req,res,next)=>{
    console.log('주식 100% 모금 확인!');
    const company = req.params.company; // 회사이름
    // console.log(company);
    client.query('select * from company where company_name=?',[company],(err,data)=>{
        const total = data[0].company_price * data[0].company_count;
        console.log(total);
        if(data[0].sold_money == total){
            console.log('모금성공!');
            next();
        }else{
            console.log('아직!');
        }
    });
});
// 모집된거 구매 처리 미들웨어5 - 주식배분
router.post('/:company/buy',(req,res,next)=>{
    console.log('주식배분!');
    const company = req.params.company; // 회사이름
    // console.log(company);
    client.query(`select company_name, name, sum(bought) toto from buy where company_name=? group by company_name, name; select * from company where company_name = ?;`,[company ,company],(err,data)=>{
        if(err) console.log(err);
        const datas = data[0]; // 매수 완료된 회사 정보
        console.log('왓!!! ',datas);
        var company_data = data[1];
        company_data = company_data[0];
        // console.log(company_data);
        datas.forEach((item,index)=>{
            // console.log((company_data.company_price * company_data.company_count)+' wow '+item.toto);
            console.log(typeof company_data.company_price,':::::',typeof company_data.company_count,'::::::',typeof item.toto,'....................');
            console.log(company_data.company_price,':::::',company_data.company_count,'::::::',item.toto);
            let buy_ju = (item.toto / company_data.company_price);
            console.log(buy_ju);
            buy_ju = buy_ju.toFixed(2);
            console.log(buy_ju);
            client.query('insert into suc(name, company_name, price, count, bought) values(?,?,?,?,?);',[
                item.name, company_data.company_name, company_data.company_price, buy_ju, item.toto
            ],(err,data)=>{
            })
        })
    });
});

module.exports = router;