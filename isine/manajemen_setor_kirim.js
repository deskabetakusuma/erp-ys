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
// router.get('/', cek_login, function(req, res) {
//   res.render('content-backoffice/manajemen_basic/list'); 
// });

router.get('/insert', cek_login, function(req, res) {
  var q="";
  var p="";
  if(req.user[0].sekolah!=""){
    q=" and flag='"+req.user[0].sekolah+"'"
    p=" and nama='"+req.user[0].sekolah+"'"
  }
  connection.query("SELECT * from akun where deleted=0"+q, function(err, akun, fields) {
    connection.query("SELECT * from sekolah where deleted=0"+p, function(err, objek, fields) {
      res.render('content-backoffice/manajemen_setor_kirim/insert',{akun,objek, user:req.user[0]}); 
      //res.json({akun,objek, user:req.user[0]})
      })
    })
});

router.post('/submit', cek_login, function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 var done=false;
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

if(req.user[0].is_admin==1){
  post['approval']=1;
}else{
  post['approval']=0;
}

post['switch']=1;
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
sql_enak.insert(post).into("jurnal").then(function (id) {
  console.log(id);
  idne=id;
})
.finally(function() {
  done = false;
  connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, credit) VALUES ('"+idne+"', '"+kode_akun+"', '"+nominal+"');", function(err, aa, fields) {
    console.log(aa.insertId);
    done=true;
  })
  deasync.loopWhile(function(){return !done;});

  for(var i=0;i<sub_kode.length;i++){
    done=false;
    connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, debit, catatan) VALUES ('"+idne+"', '"+sub_kode[i]+"', '"+jumlah[i]+"','"+catatan[i]+"');", function(err, aa, fields) {
      console.log("insert sub jurnal");
      done=true;
    })
    deasync.loopWhile(function(){return !done;});
  }
  if(req.user[0].is_admin==1){
    done=false;
    var id_objek2;
    connection.query("SELECT * from akun where kode='"+sub_kode[0]+"'", function(err, akun, fields) {
      id_objek2=akun[0].flag;
      done=true;
    });
    deasync.loopWhile(function(){return !done;});
    done=false;
    var id_jurnal2;
    connection.query("INSERT INTO jurnal (id_objek, keterangan, no_id, tgl, id_user, is_pemasukan, approval, switch) VALUES ('"+id_objek2+"', '"+post.keterangan+"', '"+post.no_id+"', '"+post.tgl+"', '"+post.id_user+"', '1', '1', '1');", function(err, aa, fields) {
      id_jurnal2=aa.insertId;
      done=true;
    })
    deasync.loopWhile(function(){return !done;});

    done=false;
    connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, debit, catatan) VALUES ('"+id_jurnal2+"', '"+sub_kode[0]+"', '"+jumlah[0]+"','"+catatan[0]+"');", function(err, aa, fields) {
      done=true;
    })
    deasync.loopWhile(function(){return !done;});

    done = false;
    connection.query("INSERT INTO subjurnal (id_jurnal, kode_akun, credit) VALUES ('"+id_jurnal2+"', '"+kode_akun+"', '"+nominal+"');", function(err, aa, fields) {
      console.log(aa.insertId);
      done=true;
    })
    deasync.loopWhile(function(){return !done;});

  }

  
    res.send('Berhasil'); 
    }) 
  
});


module.exports = router;
