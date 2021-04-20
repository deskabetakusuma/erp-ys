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
 
  res.render('content-backoffice/manajemen_jatuh_tempo/list',{user:req.user}); 
});

router.get('/list_json', cek_login, function(req, res) {
  var q="";
  if(req.query.user!=""){
q=" and sekolah='"+req.query.user+"'"
  }
  var datane=[];
  var done=false;
  connection.query("SELECT id, nama, sekolah, nisn, nipd, (select count(id) from reserved where deleted=0 and id_siswa=data_siswa.id) as jmlReserved from data_siswa where deleted=0 and status='Aktif'"+q, function(err, rows, fields) {
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

router.get('/edit/:id', function(req, res) {
  var done=false;
  var data_siswa=[];
  var tagihane=[];
  var reserved=[];
  var data_tagihan=[];
  var tot_harus_dibayar=[];
  var d = new Date();
  var y= d.getFullYear();
  var m= ("0"+(new Date().getMonth()+1)).slice(-2);
  var skrg=y+m;
  var totat_spp=0;
  var totat_danakegiatan=0;
  var totat_seragam=0;
  var totat_gedung=0;

  var data_pembayaran=[];
  
  
    connection.query("SELECT a.*, b.*, a.id as id_siswa from data_siswa a join reserved b on a.id = b.id_siswa where b.id="+req.params.id, function(err, rows, fields) {
      data_siswa=rows;
      done=true;
    })
    deasync.loopWhile(function(){return !done;});

    done=false;
      connection.query("SELECT * from reserved where deleted=0 and id_siswa="+data_siswa[0].id_siswa, function(err, reserv, fields) {
        reserved=reserv;
        done=true;
      })
      deasync.loopWhile(function(){return !done;});

    done=false;
      connection.query("SELECT sum(if(jenis = 'SPP',nominal,0)) as totpem_spp, sum(if(jenis = 'Sumbangan Gedung',nominal,0)) as totpem_gedung, sum(if(jenis = 'Seragam',nominal,0)) as totpem_seragam, sum(if(jenis = 'Dana Kegiatan',nominal,0)) as totpem_danakegiatan from pembayaran where id_siswa="+data_siswa[0].id_siswa, function(err, yyy, fields) {
        data_pembayaran=yyy;
        done=true;
      })
      deasync.loopWhile(function(){return !done;});

      for(var i=0; i<reserved.length; i++){
        
        done=false;
        connection.query("SELECT *, DATE_FORMAT(jatuh_tempo, '%Y-%m-%d') as tgl_tampil, DATE_FORMAT(jatuh_tempo,'%Y%m') as tglbanding from tagihan where id_reserved="+reserved[i].id, function(err, tagihan, fields) {
          
          if(req.params.id==reserved[i].id){
            tagihane=tagihan;
           data_tagihan= data_tagihan.concat(tagihan);
          }else{
            data_tagihan= data_tagihan.concat(tagihan);
          }
          
          done=true;
        })
        deasync.loopWhile(function(){return !done;});
      }

      for(var i=0; i<data_tagihan.length; i++){
        if(data_tagihan[i].jenis_tagihan=="SPP" && data_tagihan[i].tglbanding<=skrg){
            
            totat_spp+=parseInt(data_tagihan[i].nominal_tagihan);

          }
          if(data_tagihan[i].jenis_tagihan=="Dana Kegiatan" && data_tagihan[i].tglbanding<=skrg){
            
            totat_danakegiatan+=parseInt(data_tagihan[i].nominal_tagihan);

          }
          if(data_tagihan[i].jenis_tagihan=="Seragam" && data_tagihan[i].tglbanding<=skrg){
            
            totat_seragam+=parseInt(data_tagihan[i].nominal_tagihan);

          }
          if(data_tagihan[i].jenis_tagihan=="Sumbangan Gedung" && data_tagihan[i].tglbanding<=skrg){
            
            totat_gedung+=parseInt(data_tagihan[i].nominal_tagihan);

          }
     }
      //res.json({data_siswa, tagihan:tagihane, data_tagihan, skrg, totat_spp, totat_danakegiatan, totat_seragam, totat_gedung, data_pembayaran});
      res.render('content-backoffice/manajemen_jatuh_tempo/edit',{data_siswa, tagihan:tagihane, data_tagihan, skrg, totat_spp, totat_danakegiatan, totat_seragam, totat_gedung, data_pembayaran}); 

});

router.post('/submit_edit/:tipe/:id_reserved/:id_siswa', function(req, res) {
  console.log(req.body)
  connection.query(`delete from tagihan where jenis_tagihan='${req.params.tipe}' and id_reserved=${req.params.id_reserved};`, function(err, aa, fields) {
    for(var i=0;i<req.body.jatuh_tempo.length;i++){
      connection.query("INSERT INTO tagihan (id_reserved, jenis_tagihan, nominal_tagihan, jatuh_tempo, id_siswa) VALUES ('"+req.params.id_reserved+"', '"+req.params.tipe+"', '"+req.body.nominal_tagihan[i]+"','"+req.body.jatuh_tempo[i]+"', '"+req.params.id_siswa+"');", function(err, aa, fields) {
       
    })
    }
    res.sendStatus(200)
  })
    


})

router.post('/submit_edit_tab3/:id_reserved/:id_siswa', function(req, res) {
  console.log(req.body)
  connection.query(`delete from tagihan where (jenis_tagihan="Seragam" or jenis_tagihan="Sumbangan Gedung") and id_reserved=${req.params.id_reserved};`, function(err, aa, fields) {
    for(var i=0;i<req.body.jatuh_tempo.length;i++){
      connection.query("INSERT INTO tagihan (id_reserved, jenis_tagihan, nominal_tagihan, jatuh_tempo, id_siswa) VALUES ('"+req.params.id_reserved+"', '"+req.body.jenis[i]+"', '"+req.body.nominal_tagihan[i]+"','"+req.body.jatuh_tempo[i]+"', '"+req.params.id_siswa+"');", function(err, aa, fields) {
       
    })
    }
    res.sendStatus(200)
  })
    


})
router.post('/submit_insert', function(req, res) {
  var idne ="";
  var post = {}
 post = req.body;
 
 var tempo_spp=req.body.tempo_spp;
 var nominal_spp=req.body.nominal_spp;
 var tempo_op=[];
 var nominal_op=[];
 var tempo_gedung=[];
 var jenis=[];
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
jenis=req.body.jenis;
nominal_gedung=req.body.nominal_gedung;
delete post.tempo_gedung;
delete post.jenis;
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
    connection.query("INSERT INTO tagihan (id_reserved, jenis_tagihan, nominal_tagihan, jatuh_tempo, id_siswa) VALUES ('"+idne+"', 'SPP', '"+nominal_spp[i]+"','"+tempo_spp[i]+"','"+req.body.id_siswa+"');", function(err, aa, fields) {
      console.log("tagihan spp");
  })
  }
  for(var i=0;i<tempo_op.length;i++){
    connection.query("INSERT INTO tagihan (id_reserved, jenis_tagihan, nominal_tagihan, jatuh_tempo, id_siswa) VALUES ('"+idne+"', 'Dana Kegiatan', '"+nominal_op[i]+"','"+tempo_op[i]+"','"+req.body.id_siswa+"');", function(err, aa, fields) {
      console.log("tagihan op");
  })
  }
  for(var i=0;i<tempo_gedung.length;i++){
    connection.query("INSERT INTO tagihan (id_reserved, jenis_tagihan, nominal_tagihan, jatuh_tempo, id_siswa) VALUES ('"+idne+"', '"+jenis[i]+"', '"+nominal_gedung[i]+"','"+tempo_gedung[i]+"','"+req.body.id_siswa+"');", function(err, aa, fields) {
      console.log("tagihan gedung");
  })
  }

  res.redirect('/manajemen_jatuh_tempo');
    }) 
});
module.exports = router;
