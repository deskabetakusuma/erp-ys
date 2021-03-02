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
// aset
router.get('/aset', cek_login, function(req, res) {
  connection.query("select * from akun where LEFT(kode, 1)=1 and deleted=0", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_aset/list',{data:rows}); 
  })
});

// hutang
router.get('/hutang', cek_login, function(req, res) {
  connection.query("select * from akun where LEFT(kode, 1)=2 and deleted=0", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_hutang/list',{data:rows}); 
  })
});


// modal
router.get('/modal', cek_login, function(req, res) {
  connection.query("select * from akun where LEFT(kode, 1)=3 and deleted=0", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_modal/list',{data:rows}); 
  })
});


// pendapatan
router.get('/pendapatan', cek_login, function(req, res) {
  connection.query("select * from akun where LEFT(kode, 1)=4 and deleted=0", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_pendapatan/list',{data:rows});
  }) 
});

// beban
router.get('/beban', cek_login, function(req, res) {
  connection.query("select * from akun where LEFT(kode, 1)=6 and deleted=0", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_beban/list',{data:rows}); 
  })
});


//objek
router.get('/objek', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_objek/list'); 
});

router.get('/get_akun/:id', function(req, res) {
  connection.query("select * from akun where id="+req.params.id, function(err, data, fields) {
  res.json(data)
  })
});

router.post('/submit_akun', cek_login, function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 post['id_user']=req.user[0].id_user
console.log(post)
sql_enak.insert(post).into("akun").then(function (id) {
  console.log(id);
  idne=id;
})
.finally(function() {
  
    res.send('Berhasil'); 
    }) 
  
});

router.post('/submit_edit', function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
console.log(post)
   sql_enak("akun").where("id", req.body.id)
  .update(post).then(function (count) {
 console.log(count);
})
.finally(function() {
  
    res.send('Berhasil'); 
    }) 
  
});

router.get('/delete/:id', cek_login, function(req, res) {
  
  // senjata
  // console.log(req.params.id)
  connection.query("update akun SET deleted=1 WHERE id='"+req.params.id+"'", function(err, rows, fields) {
    
  //  if (err) throw err;
    numRows = rows.affectedRows;
    res.send("Berhasil")
  })

  
});

module.exports = router;
