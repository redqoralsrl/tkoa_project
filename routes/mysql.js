const mysql = require('mysql');
// db 연결
const client = mysql.createConnection({
    host: 'tkoa.cafe24app.com',
    user: 'redqoralsrl',
    password: 'brian1313!',
    database: 'redqoralsrl',
    port: '3306',
    multipleStatements: true,
});
module.exports = client;