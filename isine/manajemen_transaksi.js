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
router.get('/masuk/:nama_sekolah', cek_login, function(req, res) {
  var q="";
  var tgle="";
  if(req.query.start){
    q=" and (a.tgl between '"+req.query.start+"' and '"+req.query.end+"')"
    var s = new Date(req.query.start);
    var sd = s.getDate();
    var month = new Array();
    month[0] = "Januari";
    month[1] = "Februari";
    month[2] = "Maret";
    month[3] = "April";
    month[4] = "Mei";
    month[5] = "Juni";
    month[6] = "Juli";
    month[7] = "Agustus";
    month[8] = "September";
    month[9] = "Oktober";
    month[10] = "November";
    month[11] = "Desember";
var sm = month[s.getMonth()];
var sy = s.getFullYear();
    var e = new Date(req.query.end);
    var ed = e.getDate();
    var em = month[e.getMonth()];
    var ey = e.getFullYear();
    tgle=sd+" "+sm+" "+sy+"  s/d  "+ed+" "+em+" "+ey
  }
  connection.query("SELECT a.*, b.debitt as nominal, DATE_FORMAT(a.tgl,'%d %M %Y') as tgl2 from jurnal a inner join (select id_jurnal, sum(debit) as debitt from subjurnal group by id_jurnal) b on a.id=b.id_jurnal where approval=1 and is_pemasukan=1 and id_objek='"+req.params.nama_sekolah+"'"+q, function(err, data, fields) {
    res.render('content-backoffice/manajemen_transaksi/transaksi_masuk',{data, nama_sekolah:req.params.nama_sekolah, tgl:tgle}); 
  })
});

router.get('/masuk/detail/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_transaksi/detail_transaksi_masuk'); 
});

router.get('/keluar/:nama_sekolah', cek_login, function(req, res) {
  var q="";
  var tgle="";
  if(req.query.start){
    q=" and (a.tgl between '"+req.query.start+"' and '"+req.query.end+"')"
    var s = new Date(req.query.start);
    var sd = s.getDate();
    var month = new Array();
    month[0] = "Januari";
    month[1] = "Februari";
    month[2] = "Maret";
    month[3] = "April";
    month[4] = "Mei";
    month[5] = "Juni";
    month[6] = "Juli";
    month[7] = "Agustus";
    month[8] = "September";
    month[9] = "Oktober";
    month[10] = "November";
    month[11] = "Desember";
var sm = month[s.getMonth()];
var sy = s.getFullYear();
    var e = new Date(req.query.end);
    var ed = e.getDate();
    var em = month[e.getMonth()];
    var ey = e.getFullYear();
    tgle=sd+" "+sm+" "+sy+"  s/d  "+ed+" "+em+" "+ey
  }
  connection.query("SELECT a.*, b.creditt as nominal, DATE_FORMAT(a.tgl,'%d %M %Y') as tgl2 from jurnal a inner join (select id_jurnal, sum(credit) as creditt from subjurnal group by id_jurnal) b on a.id=b.id_jurnal where approval=1 and is_pemasukan=0 and id_objek='"+req.params.nama_sekolah+"'"+q, function(err, data, fields) {
    res.render('content-backoffice/manajemen_transaksi/transaksi_keluar',{data, nama_sekolah:req.params.nama_sekolah, tgl:tgle}); 
  })
});

router.get('/keluar/detail/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_transaksi/detail_transaksi_keluar'); 
});

module.exports = router;
