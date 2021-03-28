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
router.get('/pemasukan', cek_login, function(req, res) {
  connection.query("select a.*, sum(b.credit) as nominal from jurnal a join subjurnal b on a.id= b.id_jurnal where a.is_pemasukan=1 and a.approval<>1 group by a.id order by a.approval asc, a.inserted desc", function(err, data, fields) {
    if (err) throw err;
     res.render('content-backoffice/manajemen_permintaan/pemasukan', {data});
    
  })

});

router.get('/pemasukan/edit/:id', cek_login, function(req, res) {
  connection.query("SELECT * from akun ", function(err, akun, fields) {
    connection.query("SELECT * from sekolah ", function(err, objek, fields) {
      connection.query("SELECT * from jurnal where id="+req.params.id, function(err, jurnal, fields) {
        connection.query("SELECT * from subjurnal where id_jurnal="+req.params.id+" order by id asc", function(err, subjurnal, fields) {
          res.render('content-backoffice/manajemen_permintaan/edit_pemasukan',{akun,objek, user:req.user[0], jurnal, subjurnal}); 
          })
       })
      })
      })
});

router.post('/submit_pemasukan', cek_login, function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
// console.log(post)
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
sql_enak("jurnal").where("id", req.body.id)
  .update(post).then(function (count) {
 console.log(count);
})
.finally(function() {
  connection.query("DELETE FROM subjurnal where id_jurnal="+req.body.id, function(err, aax, fields) {
  connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, debit) VALUES ('"+req.body.id+"', '"+kode_akun+"', '"+nominal+"');", function(err, aa, fields) {
  for(var i=0;i<sub_kode.length;i++){
    connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, credit, catatan) VALUES ('"+req.body.id+"', '"+sub_kode[i]+"', '"+jumlah[i]+"','"+catatan[i]+"');", function(err, aa, fields) {
      console.log("insert sub jurnal");
    })
  }
})
res.send('Berhasil'); 
  })
    }) 
  
});

// -------------------------------------------------------------------
router.get('/pengeluaran', cek_login, function(req, res) {
  connection.query("select a.*, sum(b.debit) as nominal from jurnal a join subjurnal b on a.id= b.id_jurnal where a.is_pemasukan=0 and a.approval<>1 group by a.id order by a.approval asc, a.inserted desc", function(err, data, fields) {
    if (err) throw err;
     res.render('content-backoffice/manajemen_permintaan/pengeluaran', {data});
    
  })
});

router.get('/pengeluaran/edit/:id', cek_login, function(req, res) {
  connection.query("SELECT * from akun ", function(err, akun, fields) {
    connection.query("SELECT * from sekolah ", function(err, objek, fields) {
      connection.query("SELECT * from jurnal where id="+req.params.id, function(err, jurnal, fields) {
        connection.query("SELECT * from subjurnal where id_jurnal="+req.params.id+" order by id asc", function(err, subjurnal, fields) {
          res.render('content-backoffice/manajemen_permintaan/edit_pengeluaran',{akun,objek, user:req.user[0], jurnal, subjurnal}); 
          })
       })
      })
      })
});


router.post('/submit_pengeluaran', cek_login, function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
// console.log(post)
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


post['is_pemasukan']=0;
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
sql_enak("jurnal").where("id", req.body.id)
  .update(post).then(function (count) {
 console.log(count);
})
.finally(function() {
  connection.query("DELETE FROM subjurnal where id_jurnal="+req.body.id, function(err, aax, fields) {
  connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, credit) VALUES ('"+req.body.id+"', '"+kode_akun+"', '"+nominal+"');", function(err, aa, fields) {
  for(var i=0;i<sub_kode.length;i++){
    connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, debit, catatan) VALUES ('"+req.body.id+"', '"+sub_kode[i]+"', '"+jumlah[i]+"','"+catatan[i]+"');", function(err, aa, fields) {
      console.log("insert sub jurnal");
    })
  }
})
res.send('Berhasil'); 
  })
    }) 
  
});
module.exports = router;
