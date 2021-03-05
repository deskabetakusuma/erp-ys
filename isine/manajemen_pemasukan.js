var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , path = require('path')
  ,  sha1 = require('sha1');
  var sql_enak = require('../database/mysql_enak.js').connection;
  var cek_login = require('./login').cek_login;
  var cek_login_google = require('./login').cek_login_google;
  var dbgeo = require("dbgeo");
  var multer = require("multer");
  var st = require('knex-postgis')(sql_enak);
  var deasync = require('deasync');
  path.join(__dirname, '/public/foto')
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  router.use(cookieParser() );
  router.use(passport.initialize());
  router.use(passport.session());
  router.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/foto/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+'-'+file.originalname)
  }
})

var upload = multer({ storage: storage })

//start-------------------------------------
router.get('/insert', cek_login, function(req, res) {
  connection.query("SELECT * from akun ", function(err, akun, fields) {
    connection.query("SELECT * from sekolah ", function(err, objek, fields) {
      res.render('content-backoffice/manajemen_pemasukan/insert',{akun,objek, user:req.user[0]}); 
      })
    })

});

router.post('/submit', cek_login, function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
console.log(post)
var kode_akun=req.body.kode_akun;
var nominal=req.body.nominal;
var sub_kode=[];
if(req.body.sub_kode){
  sub_kode=req.body.sub_kode;
}

var jumlah=[];

if(req.body.jumlah){
  jumlah=req.body.jumlah;
}
var catatan=[];
if(req.body.catatan){
  catatan=req.body.catatan;
}

post['is_pemasukan']=1;
post['id_user']=req.user[0].id_user;
delete post.sub_kode;

delete post.jumlah;
delete post.catatan;
delete post.kode_akun;
delete post.nominal;
console.log(sub_kode);

console.log(jumlah);
console.log(catatan);
console.log(post);
sql_enak.insert(post).into("jurnal").then(function (id) {
  console.log(id);
  idne=id;
})
.finally(function() {
  connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, debit) VALUES ('"+idne+"', '"+kode_akun+"', '"+nominal+"');", function(err, aa, fields) {
  for(var i=0;i<sub_kode.length;i++){
    connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, credit, catatan) VALUES ('"+idne+"', '"+sub_kode[i]+"', '"+jumlah[i]+"','"+catatan[i]+"');", function(err, aa, fields) {
      console.log("insert sub jurnal");
    })
  }
})
    res.send('Berhasil'); 
    }) 
  
});
module.exports = router;
