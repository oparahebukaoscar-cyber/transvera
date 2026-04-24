const http = require('http');
const paths = ['/about','/About','/resources','/Resources','/'];
function check(p){
  http.get({host:'localhost',port:3000,path:p}, res=>{
    console.log(p, res.statusCode);
  }).on('error', e=>{
    console.log(p, 'ERR', e.message);
  });
}
paths.forEach(check);
