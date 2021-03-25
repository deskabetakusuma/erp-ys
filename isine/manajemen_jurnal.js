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
  var moment = require('moment');
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

//start-------------------------------------s
moment.locale('ID');
router.get('/pemasukan', cek_login, function(req, res) {
  var datane=[];
  var q="";
  let tgl_start='';
  let tgl_end='';
  if(req.query.tgl_start){
    tgl_start = req.query.tgl_start;
    q+=" and tgl>='"+req.query.tgl_start+"'"
  }
  if(req.query.tgl_end){
    tgl_end= req.query.tgl_end
    q+=" and tgl<='"+req.query.tgl_end+"'"
  }
  var done=false;
  connection.query("select *, DATE_FORMAT(tgl,'%d %m %Y') as tgl2 from jurnal where is_pemasukan=1 and approval=1"+q, function(err, rows, fields) {
datane=rows;
for(let i =0; i < datane.length; i++){
   datane[i].tgl_tampil =  moment(datane[i].tgl).format('dddd D/MMMM/YYYY')
}
done=true;
  })
  deasync.loopWhile(function(){return !done;});
  for(var i=0;i<datane.length;i++){
    datane[i].subjurnal=[];
    done=false;
    connection.query("select a.*, b.nama from subjurnal a left join akun b on a.kode_akun=b.kode where a.id_jurnal="+datane[i].id, function(err, rows, fields) {
      datane[i].subjurnal=rows;
      done=true;
    })
    deasync.loopWhile(function(){return !done;});
  }
  res.render('content-backoffice/manajemen_jurnal/pemasukan',{data:datane, tgl_start, tgl_end}); 
  // res.json({data:datane})
});

// router.get('/pemasukan', cek_login, function(req, res) {
//   res.render('content-backoffice/manajemen_jurnal/pemasukan'); 
 
// })

router.get('/pengeluaran', cek_login, function(req, res) {
  var datane=[];
  var q="";
  let tgl_start='';
  let tgl_end='';
  if(req.query.tgl_start){
    tgl_start = req.query.tgl_start;
    q+=" and tgl>='"+req.query.tgl_start+"'"
  }
  if(req.query.tgl_end){
    tgl_end= req.query.tgl_end
    q+=" and tgl<='"+req.query.tgl_end+"'"
  }
  var done=false;
  connection.query("select *, DATE_FORMAT(tgl,'%d %m %Y') as tgl2 from jurnal where is_pemasukan=0 and approval=1"+q, function(err, rows, fields) {
datane=rows;
for(let i =0; i < datane.length; i++){
  datane[i].tgl_tampil =  moment(datane[i].tgl).format('dddd D/MMMM/YYYY')
}
done=true;
  })
  deasync.loopWhile(function(){return !done;});
  for(var i=0;i<datane.length;i++){
    datane[i].subjurnal=[];
    done=false;
    connection.query("select a.*, b.nama from subjurnal a left join akun b on a.kode_akun=b.kode where a.id_jurnal="+datane[i].id, function(err, rows, fields) {
      datane[i].subjurnal=rows;
      done=true;
    })
    deasync.loopWhile(function(){return !done;});
  }
  
  // res.json(datane)
  res.render('content-backoffice/manajemen_jurnal/pengeluaran',{data:datane, tgl_start, tgl_end}); 
});

router.get('/get_masuk/:id', function(req, res) {
  var datane=[];
  var subjurnale=[];
  var q="";
  let tgl_start='';
  let tgl_end='';
  if(req.query.tgl_start){
    tgl_start = req.query.tgl_start;
    q+=" and tgl>='"+req.query.tgl_start+"'"
  }
  if(req.query.tgl_end){
    tgl_end= req.query.tgl_end
    q+=" and tgl<='"+req.query.tgl_end+"'"
  }
  var done=false;
  connection.query("select *, DATE_FORMAT(tgl,'%d %M %Y') as tgl2 from jurnal where is_pemasukan=1 and approval=1 and id="+req.params.id, function(err, rows, fields) {
datane=rows;
// for(let i =0; i < datane.length; i++){
//    datane[i].tgl_tampil =  moment(datane[i].tgl).format('dddd D/MMMM/YYYY')
// }
done=true;
  })
  deasync.loopWhile(function(){return !done;});
  
    done=false;
    connection.query("select a.*, b.nama from subjurnal a left join akun b on a.kode_akun=b.kode where a.id_jurnal="+req.params.id, function(err, rows, fields) {
      subjurnale=rows;
      done=true;
    })
    deasync.loopWhile(function(){return !done;});
  
  //res.render('content-backoffice/manajemen_jurnal/pemasukan',{data:datane, subjurnal:subjurnale}); 
   res.json({data:datane, subjurnal:subjurnale})
});

router.get('/get_keluar/:id', function(req, res) {
  var datane=[];
  var subjurnale=[];
  var q="";
  let tgl_start='';
  let tgl_end='';
  if(req.query.tgl_start){
    tgl_start = req.query.tgl_start;
    q+=" and tgl>='"+req.query.tgl_start+"'"
  }
  if(req.query.tgl_end){
    tgl_end= req.query.tgl_end
    q+=" and tgl<='"+req.query.tgl_end+"'"
  }
  var done=false;
  connection.query("select *, DATE_FORMAT(tgl,'%d %M %Y') as tgl2 from jurnal where is_pemasukan=0 and approval=1 and id="+req.params.id, function(err, rows, fields) {
datane=rows;
// for(let i =0; i < datane.length; i++){
//    datane[i].tgl_tampil =  moment(datane[i].tgl).format('dddd D/MMMM/YYYY')
// }
done=true;
  })
  deasync.loopWhile(function(){return !done;});
  
    done=false;
    connection.query("select a.*, b.nama from subjurnal a left join akun b on a.kode_akun=b.kode where a.id_jurnal="+req.params.id, function(err, rows, fields) {
      subjurnale=rows;
      done=true;
    })
    deasync.loopWhile(function(){return !done;});
  
  //res.render('content-backoffice/manajemen_jurnal/pemasukan',{data:datane, subjurnal:subjurnale}); 
   res.json({data:datane, subjurnal:subjurnale})
});
module.exports = router;
