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

// 크롤링
const cheerio_httpcli = require('cheerio-httpcli');
const url = 'https://finance.naver.com/world/';
const param = {};
let result = [];
let result1 = [];
cheerio_httpcli.fetch(url,param,function(err,$,res,body){
    let jong = "";
    let data_num = "";
    let chart = "";
    $('#worldIndexColumn1 > li.on > dl > dt > a > span').each(function(post){
        jong = $(this).text();
    })
    console.log(jong);
    $('#worldIndexColumn1 > li.on > dl > dd.point_status > strong').each(function(post){
        data_num = $(this).text();
    })
    console.log(data_num);
    $('#worldIndexColumn1 > li.on > dl > dd.graph > a > img').each(function(post){
        chart = $(this).attr('src');
    })
    console.log(chart);
    result = [jong, data_num, chart];
    let jong1 = "";
    let data_num1 = "";
    let chart1 = "";
    $('#worldIndexColumn2 > li.on > dl > dt > a > span').each(function(post){
        jong1 = $(this).text();
    })
    $('#worldIndexColumn2 > li.on > dl > dd.point_status > strong').each(function(post){
        data_num1 = $(this).text();
    })
    $('#worldIndexColumn2 > li.on > dl > dd.graph > a > img').each(function(post){
        chart1 = $(this).attr('src');
    })
    result1 = [jong1, data_num1, chart1];
})
router.get('/',(req,res)=>{
    const name = req.session.name;
    if(req.session.logined == true){
        client.query('select * from suc where name = ?;select * from solds',[name],(err,data)=>{
            res.render('trade',{
                // 보낼 정보
                logined: req.session.logined,
                id: req.session.id,
                name: req.session.name,
                address: req.session.address,
                money: req.session.money,
                data: data[0],
                market: data[1],
                momment: momment,
                result: result,
                result1: result1,
                search: false
            });
        });
    }else{
        client.query('select * from solds',(err,data)=>{
            res.render('trade',{
                logined: false,
                name: null,
                data: null,
                market: data,
                momment: momment,
                result: result,
                result1: result1,
                search: false
            });
        })
    }
});

// 판매 미들웨어 1 - 주식개수 점검 후 보유 주식 차감
router.post('/:name/:company',(req,res,next)=>{
    console.log('판매 미들웨어1');
    const name = req.params.name; // 이름
    const company = req.params.company; // 회사이름
    const body = req.body; // 데이터 가져오기
    const count = body.counts; // 팔 주식 개수
    const sold_won = body.wons; // 매도희망가격
    client.query('select * from suc where company_name=? and name=?;',[
        company, name
    ],(err,data)=>{
        if(err) console.log(err);
        if(count > data[0].count){
            res.send('<script>alert("개수를 올바르게 입력하세요!");history.back();</script>');
        }else if(count == 0){
            res.send('<script>alert("0은 입력하지마세요!");history.back();</script>')
        }else{
            const change_count = data[0].count - count;
            client.query('update suc set count=? where company_name=? and name=?;',[
                change_count, company, name
            ],(err,data)=>{
                if(err) console.log(err);
                next();
            });
        }
    });
});
// 판매 미들웨어 2 - 매도 데이터 베이스 삽입
router.post('/:name/:company',(req,res,next)=>{
    console.log('판매 미들웨어2')
    const name = req.params.name; // 이름
    const company = req.params.company; // 회사이름
    const body = req.body; // 데이터 가져오기
    const count = body.counts; // 팔 주식 개수
    const sold_won = body.wons; // 매도희망가격
    const total_sold = sold_won * count; // 최종가격
    client.query('insert into solds(company_name, name, sold_price, total_price, count) values(?,?,?,?,?)',[
        company, name, sold_won, total_sold, count
    ],(err,data)=>{
        if(err) console.log(err);
        next();
    });
});
// 판매 미들웨어 3 - 설정완료 다시 돌아가기
router.post('/:name/:company',(req,res,next)=>{
    console.log('돌아가기!');
    const name = req.session.name;
    client.query('select * from suc where name = ?;select * from solds',[name],(err,data)=>{
        res.redirect('/trade');
    });
});

// 구매 미들웨어 1 - 보유 잔액 확인
router.post('/:num',(req,res,next)=>{
    console.log('구매 미들웨어1');
    const num = req.params.num; // 판매 글번호
    const buy_name = req.session.name; // 구매자 닉네임
    client.query('select * from solds where num=?;select * from userdb where name=?;',[
       num, buy_name
    ],(err,data)=>{
        console.log(data);
        if(data[0].length != 0){
            const one = data[0];
            const two = data[1];
            if(one[0].total_price > two[0].money){
                res.send('<script>alert("잔액이 부족합니다!");history.back();</script>');
            }else{
                next();
            }
        }else{
            res.send('<script>alert("이미 팔렸습니다!");history.back();</script>');
        }
        
    });
});
// 구매 미들웨어 2 - 구매자 보유잔액 차감, 구매자 wallet 표시, suc에 주식 보유 삽입
router.post('/:num',(req,res,next)=>{
    console.log('구매 미들웨어2');
    const num = req.params.num; // 판매 글번호
    const buy_name = req.session.name; // 구매자 닉네임
    client.query('select * from solds where num=?;select * from userdb where name=?;',[
       num, buy_name
    ],(err,data)=>{
        const one = data[0];
        const two = data[1];
        const chage_msg = two[0].money - one[0].total_price;
        req.session.money = chage_msg;
        req.session.save();
        client.query('update userdb set money=? where name=?;insert into wallet(name, money_history, doit) values(?,?,?);',[
            chage_msg, buy_name, buy_name, one[0].total_price, '장외매수'
        ],(err,data)=>{
            if(err) console.log(err);
            next();
        });
    });
});
// 구매 미들웨어 2-1 - suc 체킹 후 넣기
router.post('/:num',(req,res,next)=>{
    console.log('구매 미들웨어2-1');
    const num = req.params.num; // 판매 글번호
    const buy_name = req.session.name; // 구매자 닉네임
    client.query('select * from solds where num=?',[num],(err,data)=>{
        if(err) console.log(err);
        client.query('select * from suc where name=? and company_name=?;',[buy_name, data[0].company_name],(error,datas)=>{
            if(error) console.log(error);
            console.log(datas);
            if(datas.length == 0){
                client.query('select * from company where company_name=?;',[data[0].company_name],(er,result)=>{
                    if(er) console.log(er);
                    client.query('insert into suc(name, company_name, price, count, bought) values(?,?,?,?,?);',[buy_name, result[0].company_name, result[0].company_price, data[0].count, data[0].total_price],(ers,results)=>{
                        if(ers) console.log(ers);
                        next();
                    })
                })
            }else{
                client.query('update suc set bought=?, count=? where name=? and company_name=?',[datas[0].bought + data[0].total_price, data[0].count + datas[0].count,buy_name, data[0].company_name],(er,result)=>{
                    if(er) console.log(er);
                    next();
                });
            }
        })
    })
});
// 구매 미들웨어 3 - 판매자 보유잔액 증가, 판매자 wallet 표시, sold에 주식 삭제 
router.post('/:num',(req,res,next)=>{
    console.log('구매 미들웨어3');
    const num = req.params.num; // 판매 글번호
    client.query('select * from solds where num=?;',[num],(err,data)=>{
        client.query('update userdb set money=money+? where name=?; insert into wallet(name, money_history, doit) values(?,?,?)',[data[0].total_price, data[0].name, data[0].name, data[0].total_price, '장외매도'],(er,db)=>{
            if(er) console.log(er);
            client.query('select * from suc where name=? and company_name=?',[data[0].name, data[0].company_name],(es, result)=>{
                if(es) console.log(es);
                console.log(result);
                // if(result[0].count == 0){
                    client.query('delete from suc where count=?',[0],(e,d)=>{
                        if(e) console.log(e);
                        client.query('delete from solds where num=?',[num],(ers, datass)=>{
                            if(ers) console.log(ers);
                            res.redirect('/trade');
                        })
                    })
                // }else{
                    // client.query('delete from solds where num=?',[num],(ers, datass)=>{
                        // if(ers) console.log(ers);
                        // res.redirect('/trade');
                    // })
                // }
            })
        })
    });
});

// 매도중인 매물 취소
router.post('/cancel/jusick/reload',(req,res)=>{
    const num = Number(req.body.data);
    client.query('select * from solds where num=?',[num],(err,data)=>{
        if(err) console.log(err);
        if(data[0].name == req.session.name){
            client.query('select * from suc where company_name=? and name=?',[data[0].company_name, data[0].name],(er,result)=>{
                if(er) console.log(er);
                const count_total = data[0].count + result[0].count;
                client.query('update suc set count=? where company_name=? and name=?; delete from solds where num=?',[count_total, data[0].company_name, data[0].name, num],(e,d)=>{
                    if(e) console.log(e);
                    res.send({
                        result : true
                    })
                })
            })
        }else{
            res.send('<script>alert("보안 작동!");history.back();</script>');
        }
        
    })
});

router.post('/search/data/base/give',(req,res)=>{
    const search_data = req.body.search;
    const name = req.session.name;
    if(req.session.logined == true){
        client.query(`select * from suc where name = ?;select * from solds where company_name like '%${search_data}%'`,[name],(err,data)=>{
            if(data[1].length != 0){
                res.render('trade',{
                    // 보낼 정보
                    logined: req.session.logined,
                    id: req.session.id,
                    name: req.session.name,
                    address: req.session.address,
                    money: req.session.money,
                    data: data[0],
                    market: data[1],
                    momment: momment,
                    result: result,
                    result1: result1,
                    search: true
                });
            }else{
                res.render('trade',{
                    // 보낼 정보
                    logined: req.session.logined,
                    id: req.session.id,
                    name: req.session.name,
                    address: req.session.address,
                    money: req.session.money,
                    data: data[0],
                    market: [],
                    momment: momment,
                    result: result,
                    result1: result1,
                    search: false
                });
            }
        });
    }else{
        client.query('select * from solds',(err,data)=>{
            res.render('trade',{
                logined: false,
                name: null,
                data: null,
                market: data,
                momment: momment,
                result: result,
                result1: result1,
                search: false
            });
        })
    }
});

// router.post('/search/data/sql/quick',(req,res)=>{
//     const word = req.body.data;
//     client.query(`select company_name from solds where company_name like '%${word}%'`,(err,data)=>{
//         if(err) console.log(err)
//         console.log(data);
//         if(data.length != 0){
//             res.send({
//                 result: true,
//                 data: data[0]
//             })
//         }else{
//             res.send({
//                 result: false
//             })
//         }  
//     })
// })

module.exports = router;