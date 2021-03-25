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
  connection.query(`select a.id, a.kode, a.kategori, a.nama, a.balance, IF(b.jml_credit or b.jml_debit, a.balance-b.jml_credit+b.jml_debit, a.balance) as curr_balance, b.jml_credit, b.jml_debit
  from akun a
    left join (select kode_akun, sum(credit) as jml_credit, sum(debit) as jml_debit from subjurnal group by kode_akun) b on a.kode = b.kode_akun
    where LEFT(a.kode, 1)=1 and a.deleted=0`, function(err, rows, fields) {
  res.render('content-backoffice/manajemen_aset/list',{data:rows}); 
  //res.json(rows)
  })
});

// hutang
router.get('/hutang', cek_login, function(req, res) {
  connection.query(`select a.id, a.kode, a.kategori, a.nama, a.balance, IF(b.jml_credit or b.jml_debit, a.balance+b.jml_credit-b.jml_debit, a.balance) as curr_balance, b.jml_credit, b.jml_debit
  from akun a
    left join (select kode_akun, sum(credit) as jml_credit, sum(debit) as jml_debit from subjurnal group by kode_akun) b on a.kode = b.kode_akun
    where LEFT(a.kode, 1)=2 and a.deleted=0`, function(err, rows, fields) {
  res.render('content-backoffice/manajemen_hutang/list',{data:rows}); 
  //res.json(rows)
  })
});


// modal
router.get('/modal', cek_login, function(req, res) {
  connection.query(`select a.id, a.kode, a.kategori, a.nama, a.balance, IF(b.jml_credit or b.jml_debit, a.balance+b.jml_credit-b.jml_debit, a.balance) as curr_balance, b.jml_credit, b.jml_debit
  from akun a
    left join (select kode_akun, sum(credit) as jml_credit, sum(debit) as jml_debit from subjurnal group by kode_akun) b on a.kode = b.kode_akun
    where LEFT(a.kode, 1)=3 and a.deleted=0`, function(err, rows, fields) {
  res.render('content-backoffice/manajemen_modal/list',{data:rows}); 
  //res.json(rows)
  })
});


// pendapatan
router.get('/pendapatan', cek_login, function(req, res) {
  connection.query(`select a.id, a.kode, a.kategori, a.nama, a.balance, IF(b.jml_credit or b.jml_debit, a.balance+b.jml_credit-b.jml_debit, a.balance) as curr_balance, b.jml_credit, b.jml_debit
  from akun a
    left join (select kode_akun, sum(credit) as jml_credit, sum(debit) as jml_debit from subjurnal group by kode_akun) b on a.kode = b.kode_akun
    where LEFT(a.kode, 1)=4 and a.deleted=0`, function(err, rows, fields) {
  res.render('content-backoffice/manajemen_pendapatan/list',{data:rows}); 
  //res.json(rows)
  })
});

// beban
router.get('/beban', cek_login, function(req, res) {
  connection.query(`select a.id, a.kode, a.kategori, a.nama, a.balance, IF(b.jml_credit or b.jml_debit, a.balance-b.jml_credit+b.jml_debit, a.balance) as curr_balance, b.jml_credit, b.jml_debit
  from akun a
    left join (select kode_akun, sum(credit) as jml_credit, sum(debit) as jml_debit from subjurnal group by kode_akun) b on a.kode = b.kode_akun
    where LEFT(a.kode, 1)=6 and a.deleted=0`, function(err, rows, fields) {
  res.render('content-backoffice/manajemen_beban/list',{data:rows}); 
  //res.json(rows)
  })
});


//objek
router.get('/objek', cek_login, function(req, res) {
  connection.query("select * from sekolah where is_sekolah=0 and deleted=0", function(err, rows, fields) {
  res.render('content-backoffice/manajemen_objek/list',{data:rows}); 
  })
});

router.get('/get_akun/:id', function(req, res) {
  connection.query("select * from akun where id="+req.params.id, function(err, data, fields) {
  res.json(data)
  })
});

router.get('/get_objek/:id', function(req, res) {
  connection.query("select * from sekolah where id="+req.params.id, function(err, data, fields) {
  res.json(data)
  })
});

router.post('/submit_akun', cek_login, function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 post['id_user']=req.user[0].id_user
console.log(post)
var cek_rows;
var done=false;
connection.query("select count(*) as jml from akun where kode='"+req.body.kode+"' and deleted=0", function(err, rows, fields) {
cek_rows=rows[0].jml;
console.log(cek_rows);
done=true;
})
deasync.loopWhile(function(){return !done;});
console.log('ini cek rows'+cek_rows);
console.log(cek_rows==0)
if(cek_rows==0){
  console.log("jmbt");
  sql_enak.insert(post).into("akun").then(function (id) {
    console.log(id);
    idne=id;
  })
  .finally(function() {
    
      res.json({data:1}); 
      }) 
}else{
  res.json({data:0}); 
}
});

router.post('/submit_edit', function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
console.log(post)
var cek_rows;
var done=false;
connection.query("select count(*) as jml from akun where kode='"+req.body.kode+"' and deleted=0 and id!="+req.body.id, function(err, rows, fields) {
cek_rows=rows[0].jml;
console.log(cek_rows);
done=true;
})
deasync.loopWhile(function(){return !done;});
if(cek_rows==0){
   sql_enak("akun").where("id", req.body.id)
  .update(post).then(function (count) {
 console.log(count);
})
.finally(function() {
  
  res.json({data:1}); 
    }) 
}else{
  res.json({data:0}); 
}
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


router.post('/submit_objek', cek_login, function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
console.log(post)

sql_enak.insert(post).into("sekolah").then(function (id) {
  console.log(id);
  idne=id;
})
.finally(function() {
  
    res.send('Berhasil'); 
    }) 
  
});

router.post('/update_objek', cek_login, function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
console.log(post)

sql_enak("sekolah").where("id", req.body.id)
  .update(post).then(function (count) {
 console.log(count);
})
.finally(function() {
  
    res.send('Berhasil'); 
    }) 
  
});

router.get('/delete_objek/:id', cek_login, function(req, res) {
  
  // senjata
  // console.log(req.params.id)
  connection.query("update sekolah SET deleted=1 WHERE id='"+req.params.id+"'", function(err, rows, fields) {
    
  //  if (err) throw err;
    numRows = rows.affectedRows;
    res.send("Berhasil")
  })

  
});
module.exports = router;
