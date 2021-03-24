const express = require('express');
const router = express.Router();
const client = require('./mysql');

// 크롤링
const cheerio_httpcli = require('cheerio-httpcli');
let url = 'https://search.naver.com/search.naver?where=news&query=%EC%A3%BC%EC%8B%9D&sm=tab_srt&sort=1&photo=0&field=0&reporter_article=&pd=0&ds=&de=&docid=&nso=so%3Add%2Cp%3Aall%2Ca%3Aall&mynews=0&refresh_start=0&related=0';
let param = {};

/* GET home page. */
// 메인 처리
router.get('/',(req,res)=>{
  console.log('메인페이지 작동');
  console.log(req.session);
  // 크롤링
  cheerio_httpcli.fetch(url,param,function(err,$,res,body){
        let result = "";
        let result1 = "";
        let sss= "";
        let sss1 = "";
        if(err){
            console.log(err);
            return;
        }
        // li#sp_nws1:nth-of-type(1)
        $("ul.list_news li#sp_nws1 div.news_wrap div.news_area a.news_tit").each(function(post){
            result = $(this).text();
            sss = $(this).attr('href');
        });
        $("ul.list_news li#sp_nws2 div.news_wrap div.news_area a").each(function(post){
            result1 = $(this).text();
            sss1 = $(this).attr('href');
        });

        console.log(result);
        console.log(sss);
        console.log(result1);
        console.log(sss1);
        // 미리 업데이트 1과 2를 만들어서 업데이트로 지속적으로 때린다
        client.query('update news set news=?, href=? where num=? ',[
            result, sss, 1
        ],(err,data)=>{
            if(err) console.log(err);
        });
        client.query('update news set news=?, href=? where num=? ',[
            result1, sss1, 2
        ],(err,data)=>{
            if(err) console.log(err);
        });
  });
  client.query('select * from news; select * from toron order by num desc;',(err,data)=>{
        if(req.session.logined == true){
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
        }else{
            res.render('index',{
                logined: false,
                data: data[0],
                toron: data[1]
            });
        }
  });
  
});

// 로그아웃 처리
router.get('/logout',(req,res)=>{
  console.log('로그아웃 성공');
  const cookieid = req.session.id;
  req.session.destroy(function(err){
      res.clearCookie(cookieid);
      res.redirect('/');
  });
});

module.exports = router;
