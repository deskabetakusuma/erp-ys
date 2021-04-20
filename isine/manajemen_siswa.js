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
router.get('/list_tunggakan', cek_login, function(req, res) {
  var q="";
  if(req.query.sekolah){
    q=`and a.sekolah='`+req.query.sekolah+`'`
  }
  console.log(`select a.*, b.spp as tag_spp, b.kegiatan as tag_kegiatan, b.gedung as tag_gedung, b.seragam as tag_seragam, c.spp1 as pay_spp, c.kegiatan1 as pay_kegiatan, c.gedung1 as pay_gedung, c.seragam1 as pay_seragam from data_siswa a left join (select id_siswa, sum(if(jenis_tagihan = 'SPP',nominal_tagihan,0)) as spp, sum(if(jenis_tagihan = 'Dana Kegiatan',nominal_tagihan,0)) as kegiatan, sum(if(jenis_tagihan = 'Sumbangan Gedung',nominal_tagihan,0)) as gedung, sum(if(jenis_tagihan = 'Seragam',nominal_tagihan,0)) as seragam from tagihan where DATE_FORMAT(jatuh_tempo,'%Y%m')<=DATE_FORMAT(curdate(),'%Y%m') group by id_siswa) b on a.id=b.id_siswa left join (select id_siswa, sum(if(jenis = 'SPP',nominal,0)) as spp1, sum(if(jenis = 'Dana Kegiatan',nominal,0)) as kegiatan1, sum(if(jenis = 'Sumbangan Gedung',nominal,0)) as gedung1, sum(if(jenis = 'Seragam',nominal,0)) as seragam1 from pembayaran group by id_siswa) c on a.id=c.id_siswa where (b.spp>c.spp1 or b.seragam>c.seragam1 or b.gedung>c.gedung1 or b.kegiatan>c.kegiatan1) and a.status='Aktif' and a.deleted=0`+q);
  connection.query(`select a.*, b.spp as tag_spp, b.kegiatan as tag_kegiatan, b.gedung as tag_gedung, b.seragam as tag_seragam,
   c.spp1 as pay_spp, c.kegiatan1 as pay_kegiatan, c.gedung1 as pay_gedung, c.seragam1 as pay_seragam
  from data_siswa a left join (select id_siswa, sum(if(jenis_tagihan = 'SPP',nominal_tagihan,0)) as spp, sum(if(jenis_tagihan = 'Dana Kegiatan',nominal_tagihan,0)) as kegiatan, sum(if(jenis_tagihan = 'Sumbangan Gedung',nominal_tagihan,0)) as gedung, sum(if(jenis_tagihan = 'Seragam',nominal_tagihan,0)) as seragam from tagihan where DATE_FORMAT(jatuh_tempo,'%Y%m')<=DATE_FORMAT(curdate(),'%Y%m') group by id_siswa) b on a.id=b.id_siswa
   left join (select id_siswa, sum(if(jenis = 'SPP',nominal,0)) as spp1, sum(if(jenis = 'Dana Kegiatan',nominal,0)) as kegiatan1, sum(if(jenis = 'Sumbangan Gedung',nominal,0)) as gedung1, sum(if(jenis = 'Seragam',nominal,0)) as seragam1 from pembayaran group by id_siswa) c on a.id=c.id_siswa 
   where (b.spp>c.spp1 or b.seragam>c.seragam1 or b.gedung>c.gedung1 or b.kegiatan>c.kegiatan1) and a.status='Aktif' and a.deleted=0`+q, function(err, rows, fields) {
    //res.json({data:rows})
    res.render('content-backoffice/manajemen_siswa/list_tunggakan',{data:rows}); 
  })
});

router.get('/detail/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_siswa/detail'); 
});

router.get('/', cek_login, function(req, res) {
  var q="";
  if(req.user[0].sekolah!=""){
    q=" and sekolah='"+req.user[0].sekolah+"'"
  }
    connection.query("SELECT *, DATE_FORMAT(tanggal_lahir,'%d %M %Y') as tanggal_lahir2 from data_siswa where deleted=0"+q, function(err, data, fields) {
  res.render('content-backoffice/manajemen_siswa/list',{data}); 
    })
});

router.get('/insert', cek_login, function(req, res) {
  connection.query("SELECT * from sekolah where deleted=0 and is_sekolah=1", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_siswa/insert',{sekolah:rows, user:req.user}); 
  })
});

router.get('/edit/:id', cek_login, function(req, res) {
  connection.query("SELECT *, DATE_FORMAT(tanggal_lahir,'%Y-%m-%d') as tanggal_lahir2 from data_siswa where deleted=0 and id="+req.params.id, function(err, data, fields) {
  connection.query("SELECT * from sekolah where deleted=0 and is_sekolah=1", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_siswa/edit',{data, sekolah:rows, user:req.user});
  }) 
})
});

router.post('/submit_insert', upload.fields([{ name: 'foto', maxCount: 1 }]), function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 if(req.files){
  if(req.files['foto']){
       var nama_file = req.files['foto'][0].filename;
      // nama_file = nama_file.slice(0, -4)
          post['foto'] = nama_file;
       }
      }
console.log(post)
sql_enak.insert(post).into("data_siswa").then(function (id) {
  console.log(id);
  idne=id;
})
.finally(function() {
  
    res.send('Berhasil'); 
    }) 
  
});

router.post('/submit_edit', upload.fields([{ name: 'foto', maxCount: 1 }]), function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 if(req.files){
  if(req.files['foto']){
       var nama_file = req.files['foto'][0].filename;
      // nama_file = nama_file.slice(0, -4)
          post['foto'] = nama_file;
       }
      }
console.log(post)
sql_enak("data_siswa").where("id", req.body.id)
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
  connection.query("update data_siswa SET deleted=1 WHERE id='"+req.params.id+"' ", function(err, rows, fields) {
  //  if (err) throw err;
    numRows = rows.affectedRows;
  })

  res.redirect('/manajemen_siswa');
});

router.get('/get_siswa/:nama_sekolah', function(req, res) {
  connection.query("SELECT id, nama, nisn, nipd from data_siswa where deleted=0 and sekolah='"+req.params.nama_sekolah+"' and status='Aktif'", function(err, data, fields) {
    res.json(data)
  });
});
module.exports = router;
