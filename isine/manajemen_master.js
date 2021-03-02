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
//Kelas
router.get('/kelas', cek_login, function(req, res) {
  connection.query("SELECT * from kelas where deleted=0", function(err, rows, fields) {
    res.render('content-backoffice/manajemen_kelas/list', {data:rows}); 
  });
});

router.get('/kelas/insert', cek_login, function(req, res) {
  connection.query("SELECT * from sekolah where deleted=0 and is_sekolah=1", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_kelas/insert',{sekolah:rows}); 
  })
});

router.get('/kelas/edit/:id', cek_login, function(req, res) {
  connection.query("SELECT * from sekolah where deleted=0 and is_sekolah=1", function(err, rowss, fields) {
  connection.query("SELECT * from kelas where id='"+req.params.id+"'", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_kelas/edit', {data:rows, sekolah:rowss}); 
  });
})
});

router.post('/kelas/submit_insert', cek_login, function(req, res){
  var post = {}
 post = req.body;
    console.log(post)
   sql_enak.insert(post).into("kelas").then(function (id) {
  console.log(id);
})
.finally(function() {
  //sql_enak.destroy();
  res.redirect('/manajemen_master/kelas'); 
});
});

router.post('/kelas/submit_edit', cek_login, function(req, res){
  var post = {}
 post = req.body;
    console.log(post)

   sql_enak("kelas").where("id", req.body.id)
  .update(post).then(function (count) {
 console.log(count);
})
.finally(function() {
  //sql_enak.destroy();
  res.redirect('/manajemen_master/kelas');
});
});

router.get('/kelas/delete/:id', cek_login, function(req, res) {
  
  // senjata
  // console.log(req.params.id)
  connection.query("update kelas SET deleted=1 WHERE id='"+req.params.id+"' ", function(err, rows, fields) {
  //  if (err) throw err;
    numRows = rows.affectedRows;
  })

  res.redirect('/manajemen_master/kelas');
});




//Tahun Ajaran
router.get('/tahun_ajaran', cek_login, function(req, res) {
  connection.query("SELECT * from tahun_ajaran where deleted=0", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_tahun_ajaran/list', {data:rows}); 
});
});

router.get('/tahun_ajaran/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_tahun_ajaran/insert'); 
});

router.get('/tahun_ajaran/edit/:id', cek_login, function(req, res) {
  connection.query("SELECT * from tahun_ajaran where id='"+req.params.id+"'", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_tahun_ajaran/edit', {data:rows}); 
});
});

router.post('/tahun_ajaran/submit_insert', cek_login, function(req, res){
  var post = {}
 post = req.body;
    console.log(post)
   sql_enak.insert(post).into("tahun_ajaran").then(function (id) {
  console.log(id);
})
.finally(function() {
  //sql_enak.destroy();
  res.redirect('/manajemen_master/tahun_ajaran'); 
});
});

router.post('/tahun_ajaran/submit_edit', cek_login, function(req, res){
  var post = {}
 post = req.body;
    console.log(post)

   sql_enak("tahun_ajaran").where("id", req.body.id)
  .update(post).then(function (count) {
 console.log(count);
})
.finally(function() {
  //sql_enak.destroy();
  res.redirect('/manajemen_master/tahun_ajaran');
});
});

router.get('/tahun_ajaran/delete/:id', cek_login, function(req, res) {
  
  // senjata
  // console.log(req.params.id)
  connection.query("update tahun_ajaran SET deleted=1 WHERE id='"+req.params.id+"' ", function(err, rows, fields) {
  //  if (err) throw err;
    numRows = rows.affectedRows;
  })

  res.redirect('/manajemen_master/tahun_ajaran');
});

router.get('/get_kelas/:nama_sekolah', function(req, res) {
  connection.query("SELECT * from kelas where deleted=0 and sekolah='"+req.params.nama_sekolah+"'", function(err, data, fields) {
    res.json(data)
  });
});
module.exports = router;
