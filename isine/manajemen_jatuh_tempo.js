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
router.get('/', cek_login, function(req, res) {
 
  res.render('content-backoffice/manajemen_jatuh_tempo/list'); 
});

router.get('/list_json', cek_login, function(req, res) {
  var datane=[];
  var done=false;
  connection.query("SELECT id, nama, sekolah, nisn, nipd, (select count(id) from reserved where deleted=0 and id_siswa=data_siswa.id) as jmlReserved from data_siswa where deleted=0", function(err, rows, fields) {
    datane=rows;
    done=true;
  })
  deasync.loopWhile(function(){return !done;});
  // for(var index=0; index<datane.length; index++){
  //   done=false;
  //   datane[index].reserved=[];
  //   connection.query("SELECT id, kelas, tahun_ajaran from reserved where deleted=0 and id_siswa="+datane[index].id, function(err, rows, fields) {
  //     datane[index].reserved=rows;
  //     done=true;
  //   })
  //   deasync.loopWhile(function(){return !done;});
  // }
  //res.json(datane);
  res.json({data:datane}); 
});

router.get('/detail_reserved/:id_reserved', cek_login, function(req, res) {
  var datane=[];

 
   let done=false;
    
    connection.query("SELECT id, kelas, tahun_ajaran from reserved where deleted=0 and id_siswa="+req.params.id_reserved, function(err, rows, fields) {
      datane=rows;
      done=true;
    })
    deasync.loopWhile(function(){return !done;});

  //res.json(datane);
  res.json({data:datane}); 
});

router.get('/insert', cek_login, function(req, res) {
  connection.query("SELECT * from tahun_ajaran where deleted=0", function(err, tahun_ajaran, fields) {
  connection.query("SELECT * from sekolah where deleted=0 and is_sekolah=1", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_jatuh_tempo/insert',{sekolah:rows, tahun_ajaran}); 
  })
})
});

router.get('/edit/:id', cek_login, function(req, res) {
    connection.query("SELECT a.*, b.* from data_siswa a join reserved b on a.id = b.id_siswa where b.id="+req.params.id, function(err, rows, fields) {
      connection.query("SELECT *, DATE_FORMAT(jatuh_tempo, '%Y-%m-%d') as tgl_tampil from tagihan where id_reserved="+req.params.id, function(err, tagihan, fields) {
        res.render('content-backoffice/manajemen_jatuh_tempo/edit',{data_siswa:rows, tagihan}); 
        })
      
    })
 

});

router.post('/submit_insert', function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
 var tempo_spp=req.body.tempo_spp;
 var nominal_spp=req.body.nominal_spp;
 var tempo_op=[];
 var nominal_op=[];
 var tempo_gedung=[];
 var nominal_gedung=[];
 if(req.body.tempo_op){
tempo_op=req.body.tempo_op;
nominal_op=req.body.nominal_op;
delete post.tempo_op;
delete post.nominal_op;
console.log('ini tempo op');
console.log(tempo_op);
 }
 if(req.body.tempo_gedung){
tempo_gedung=req.body.tempo_gedung;
nominal_gedung=req.body.nominal_gedung;
delete post.tempo_gedung;
delete post.nominal_gedung;
console.log('ini tempo gedung');
console.log(tempo_gedung);
}
delete post.tempo_spp;
delete post.nominal_spp;



console.log(post);
console.log(tempo_spp);
console.log(nominal_spp);

sql_enak.insert(post).into("reserved").then(function (id) {
  console.log(id);
  idne=id;
})
.finally(function() {
  for(var i=0;i<tempo_spp.length;i++){
    connection.query("INSERT INTO tagihan (id_reserved, jenis_tagihan, nominal_tagihan, jatuh_tempo) VALUES ('"+idne+"', 'spp', '"+nominal_spp[i]+"','"+tempo_spp[i]+"');", function(err, aa, fields) {
      console.log("tagihan spp");
  })
  }
  for(var i=0;i<tempo_op.length;i++){
    connection.query("INSERT INTO tagihan (id_reserved, jenis_tagihan, nominal_tagihan, jatuh_tempo) VALUES ('"+idne+"', 'operasional', '"+nominal_op[i]+"','"+tempo_op[i]+"');", function(err, aa, fields) {
      console.log("tagihan op");
  })
  }
  for(var i=0;i<tempo_gedung.length;i++){
    connection.query("INSERT INTO tagihan (id_reserved, jenis_tagihan, nominal_tagihan, jatuh_tempo) VALUES ('"+idne+"', 'gedung', '"+nominal_gedung[i]+"','"+tempo_gedung[i]+"');", function(err, aa, fields) {
      console.log("tagihan gedung");
  })
  }

  res.redirect('/manajemen_jatuh_tempo');
    }) 
});
module.exports = router;
