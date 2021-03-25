var express = require('express')
  , http = require('http')
  , path = require('path')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , static = require('serve-static')
  , errorHandler =require('errorhandler')
  , passport = require('passport')
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  , flash=require("connect-flash")
  , LocalStrategy = require('passport-local').Strategy;
  var deasync = require('deasync');

var login = require('./isine/login').router;
var peta = require('./isine/topojson');
var upload = require('./isine/upload_file');
var upload_shp = require('./isine/upload_shp');
var user = require('./isine/user');
var fn = require('./isine/ckeditor-upload-image');
var cek_login = require('./isine/login').cek_login;
var basic = require('./isine/basic');
var manajemen_master = require('./isine/manajemen_master');
var manajemen_siswa = require('./isine/manajemen_siswa');
var manajemen_jatuh_tempo = require('./isine/manajemen_jatuh_tempo');
var manajemen_akun = require('./isine/manajemen_akun');
var manajemen_pemasukan = require('./isine/manajemen_pemasukan');
var manajemen_pengeluaran = require('./isine/manajemen_pengeluaran');
var manajemen_jurnal = require('./isine/manajemen_jurnal');
var manajemen_pembayaran = require('./isine/manajemen_pembayaran');
var manajemen_transaksi = require('./isine/manajemen_transaksi');
var manajemen_permintaan = require('./isine/manajemen_permintaan');


var app = express();
var connection = require('./database').connection;
//var mysql2geojson = require("mysql2geojson");
var router = express.Router();
var dbgeo = require("dbgeo");
app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
//app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');


//end dbf dan shp
// all environments
app.set('port', process.env.PORT || 8843);

//app.use(express.favicon());
app.use(function (req, res, next) {

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
app.use(logger('dev'));
app.use(methodOverride());
app.use(static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser() );
app.use(session({duration: 50 * 60 * 1000,
                      activeDuration: 10 * 60 * 1000,
                       secret: 'bhagasitukeren', 
                       cookie: { maxAge : 60 * 60 * 1000 },
                       cookieName: 'session',
                       saveUninitialized: true,
                        resave: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());  
// Add headers

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}
 var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));  
});
var io = require('socket.io').listen(server, { log: false });

//mulai apps ----------------------------------------------------------
app.use('/autentifikasi', login);
app.use('/peta', peta);
app.use('/upload', upload);
app.use('/upload_shp', upload_shp);
app.use('/user', user);
app.use('/uploadckeditor', fn);

app.use('/basic', basic);
app.use('/manajemen_master', manajemen_master);
app.use('/manajemen_siswa', manajemen_siswa);
app.use('/manajemen_jatuh_tempo', manajemen_jatuh_tempo);
app.use('/manajemen_akun', manajemen_akun);
app.use('/manajemen_pemasukan', manajemen_pemasukan);
app.use('/manajemen_pengeluaran', manajemen_pengeluaran);
app.use('/manajemen_jurnal', manajemen_jurnal);
app.use('/manajemen_pembayaran', manajemen_pembayaran);
app.use('/manajemen_transaksi', manajemen_transaksi);
app.use('/manajemen_permintaan', manajemen_permintaan);


// app.get('/', cek_login, function (req, res) {
//   console.log(req.user)
//   res.render('content-backoffice/index');
// });


app.get('/backoffice', cek_login, function (req, res) {
  var objek=[];
  var done=false;
  connection.query("SELECT * from sekolah where deleted=0 and is_sekolah=1", function(err, data, fields) {
    objek=data;
  done=true;
  })
  deasync.loopWhile(function(){return !done;});
  for(var i=0; i<objek.length;i++){
    objek[i].pemasukan_debit=0;
    objek[i].pemasukan_credit=0;
    objek[i].pengeluaran_debit=0;
    objek[i].pengeluaran_credit=0;
    objek[i].nunggak=0;
    objek[i].nunggak_spp=0;
    objek[i].nunggak_seragam=0;
    objek[i].nunggak_gedung=0;
    objek[i].nunggak_kegiatan=0;
    objek[i].nomnunggak=0;
    objek[i].nomnunggak_spp=0;
    objek[i].nomnunggak_seragam=0;
    objek[i].nomnunggak_gedung=0;
    objek[i].nomnunggak_kegiatan=0;
    objek[i].jml_siswa=0;
    done=false;
    console.log("SELECT a.is_pemasukan, sum(b.debit) as debit, sum(b.credit) as credit from jurnal a join subjurnal b on a.id=b.id_jurnal where a.approval=1 and a.id_objek='"+objek[i].nama+"' group by a.is_pemasukan")
    connection.query("SELECT a.is_pemasukan, sum(b.debit) as debit, sum(b.credit) as credit from jurnal a join subjurnal b on a.id=b.id_jurnal where a.approval=1 and a.id_objek='"+objek[i].nama+"' group by a.is_pemasukan", function(err, data, fields) {
      for(var j=0;j<data.length;j++){
        if(data[j].debit!=null && data[j].is_pemasukan==1){
          objek[i].pemasukan_debit=data[j].debit;
        }
        if(data[j].credit!=null && data[j].is_pemasukan==1){
        objek[i].pemasukan_credit=data[j].credit;
        }
        if(data[j].debit!=null && data[j].is_pemasukan==0){
          objek[i].pengeluaran_debit=data[j].debit;
        }
        if(data[j].credit!=null && data[j].is_pemasukan==0){
        objek[i].pengeluaran_credit=data[j].credit;
        }
      }
      
      
    done=true;
    })
    deasync.loopWhile(function(){return !done;});


      done=false;
      connection.query("SELECT a.id, b.spp as bayar_spp, b.dana_kegiatan as bayar_kegiatan, b.seragam as bayar_seragam, b.gedung as bayar_gedung, c.t_spp as tagihan_spp, c.t_kegiatan as tagihan_kegiatan, c.t_seragam as tagihan_seragam, c.t_gedung as tagihan_gedung from data_siswa a left join (select id_siswa, SUM(CASE WHEN jenis ='SPP' THEN nominal ELSE 0 END) as spp, SUM(CASE WHEN jenis ='Dana Kegiatan' THEN nominal ELSE 0 END) as dana_kegiatan, SUM(CASE WHEN jenis ='Seragam' THEN nominal ELSE 0 END) as seragam, SUM(CASE WHEN jenis ='Sumbangan Gedung' THEN nominal ELSE 0 END) as gedung from pembayaran group by id_siswa) b on a.id = b.id_siswa left join (select id_siswa, SUM(CASE WHEN jenis_tagihan ='SPP' THEN nominal_tagihan ELSE 0 END) as t_spp, SUM(CASE WHEN jenis_tagihan ='Dana Kegiatan' THEN nominal_tagihan ELSE 0 END) as t_kegiatan, SUM(CASE WHEN jenis_tagihan ='Seragam' THEN nominal_tagihan ELSE 0 END) as t_seragam, SUM(CASE WHEN jenis_tagihan ='Sumbangan Gedung' THEN nominal_tagihan ELSE 0 END) as t_gedung from tagihan where year(jatuh_tempo) * 100 + month(jatuh_tempo)<= year(now()) * 100 + month(now()) group by id_siswa) c on a.id = c.id_siswa where a.deleted=0 and a.status='Aktif' and a.sekolah='"+objek[i].nama+"'", function(err, data, fields) {
        //objek[i].data_siswa=data;
        objek[i].jml_siswa=data.length;
        for(var k=0;k<data.length;k++){
          if(data[k].bayar_spp<data[k].tagihan_spp || data[k].bayar_kegiatan<data[k].tagihan_kegiatan || data[k].bayar_seragam<data[k].tagihan_seragam || data[k].bayar_gedung<data[k].tagihan_gedung){
            objek[i].nunggak+=1;
          }
          if(data[k].bayar_spp<data[k].tagihan_spp){
            objek[i].nunggak_spp+=1;
            objek[i].nomnunggak_spp+=data[k].bayar_spp-data[k].tagihan_spp;
            objek[i].nomnunggak+=data[k].bayar_spp-data[k].tagihan_spp;
          }
          if(data[k].bayar_kegiatan<data[k].tagihan_kegiatan){
            objek[i].nunggak_kegiatan+=1;
            objek[i].nomnunggak_kegiatan+=data[k].bayar_kegiatan-data[k].tagihan_kegiatan;
            objek[i].nomnunggak+=data[k].bayar_kegiatan-data[k].tagihan_kegiatan;
          }
          if(data[k].bayar_seragam<data[k].tagihan_seragam){
            objek[i].nunggak_seragam+=1;
            objek[i].nomnunggak_seragam+=data[k].bayar_seragam-data[k].tagihan_seragam;
            objek[i].nomnunggak+=data[k].bayar_seragam-data[k].tagihan_seragam;
          }
          if(data[k].bayar_gedung<data[k].tagihan_gedung){
            objek[i].nunggak_gedung+=1;
            objek[i].nomnunggak_gedung+=data[k].bayar_gedung-data[k].tagihan_gedung;
            objek[i].nomnunggak+=data[k].bayar_gedung-data[k].tagihan_gedung;
          }
          
        }
      done=true;
      })
      deasync.loopWhile(function(){return !done;});
      
  }
  //res.json(objek)
  res.render('content-backoffice/index',{data:objek});
});


app.get('/get_dashboard', function (req, res) {
  var q="";
  if(req.query.sekolah){
    q+=" and nama='"+req.query.sekolah+"'"
  }
  var q_tgl="";
  if(req.query.start){
    q_tgl=" and (a.tgl between '"+req.query.start+"' and '"+req.query.end+"')";
  }
 
  var objek=[];
  var done=false;
  connection.query("SELECT * from sekolah where deleted=0 and is_sekolah=1"+q, function(err, data, fields) {
    objek=data;
  done=true;
  })
  deasync.loopWhile(function(){return !done;});
  for(var i=0; i<objek.length;i++){
    objek[i].pemasukan_debit=0;
    objek[i].pemasukan_credit=0;
    objek[i].pengeluaran_debit=0;
    objek[i].pengeluaran_credit=0;
    objek[i].nunggak=0;
    objek[i].nunggak_spp=0;
    objek[i].nunggak_seragam=0;
    objek[i].nunggak_gedung=0;
    objek[i].nunggak_kegiatan=0;
    objek[i].nomnunggak=0;
    objek[i].nomnunggak_spp=0;
    objek[i].nomnunggak_seragam=0;
    objek[i].nomnunggak_gedung=0;
    objek[i].nomnunggak_kegiatan=0;
    objek[i].jml_siswa=0;
    done=false;
    console.log("SELECT a.is_pemasukan, sum(b.debit) as debit, sum(b.credit) as credit from jurnal a join subjurnal b on a.id=b.id_jurnal where a.approval=1 and a.id_objek='"+objek[i].nama+"'"+q_tgl+" group by a.is_pemasukan")
    connection.query("SELECT a.is_pemasukan, sum(b.debit) as debit, sum(b.credit) as credit from jurnal a join subjurnal b on a.id=b.id_jurnal where a.approval=1 and a.id_objek='"+objek[i].nama+"'"+q_tgl+" group by a.is_pemasukan", function(err, data, fields) {
      for(var j=0;j<data.length;j++){
        if(data[j].debit!=null && data[j].is_pemasukan==1){
          objek[i].pemasukan_debit=data[j].debit;
        }
        if(data[j].credit!=null && data[j].is_pemasukan==1){
        objek[i].pemasukan_credit=data[j].credit;
        }
        if(data[j].debit!=null && data[j].is_pemasukan==0){
          objek[i].pengeluaran_debit=data[j].debit;
        }
        if(data[j].credit!=null && data[j].is_pemasukan==0){
        objek[i].pengeluaran_credit=data[j].credit;
        }
      }
      
      
    done=true;
    })
    deasync.loopWhile(function(){return !done;});


      done=false;
      connection.query("SELECT a.id, b.spp as bayar_spp, b.dana_kegiatan as bayar_kegiatan, b.seragam as bayar_seragam, b.gedung as bayar_gedung, c.t_spp as tagihan_spp, c.t_kegiatan as tagihan_kegiatan, c.t_seragam as tagihan_seragam, c.t_gedung as tagihan_gedung from data_siswa a left join (select id_siswa, SUM(CASE WHEN jenis ='SPP' THEN nominal ELSE 0 END) as spp, SUM(CASE WHEN jenis ='Dana Kegiatan' THEN nominal ELSE 0 END) as dana_kegiatan, SUM(CASE WHEN jenis ='Seragam' THEN nominal ELSE 0 END) as seragam, SUM(CASE WHEN jenis ='Sumbangan Gedung' THEN nominal ELSE 0 END) as gedung from pembayaran group by id_siswa) b on a.id = b.id_siswa left join (select id_siswa, SUM(CASE WHEN jenis_tagihan ='SPP' THEN nominal_tagihan ELSE 0 END) as t_spp, SUM(CASE WHEN jenis_tagihan ='Dana Kegiatan' THEN nominal_tagihan ELSE 0 END) as t_kegiatan, SUM(CASE WHEN jenis_tagihan ='Seragam' THEN nominal_tagihan ELSE 0 END) as t_seragam, SUM(CASE WHEN jenis_tagihan ='Sumbangan Gedung' THEN nominal_tagihan ELSE 0 END) as t_gedung from tagihan where year(jatuh_tempo) * 100 + month(jatuh_tempo)<= year(now()) * 100 + month(now()) group by id_siswa) c on a.id = c.id_siswa where a.deleted=0 and a.status='Aktif' and a.sekolah='"+objek[i].nama+"'", function(err, data, fields) {
        //objek[i].data_siswa=data;
        objek[i].jml_siswa=data.length;
        for(var k=0;k<data.length;k++){
          if(data[k].bayar_spp<data[k].tagihan_spp || data[k].bayar_kegiatan<data[k].tagihan_kegiatan || data[k].bayar_seragam<data[k].tagihan_seragam || data[k].bayar_gedung<data[k].tagihan_gedung){
            objek[i].nunggak+=1;
          }
          if(data[k].bayar_spp<data[k].tagihan_spp){
            objek[i].nunggak_spp+=1;
            objek[i].nomnunggak_spp+=data[k].bayar_spp-data[k].tagihan_spp;
            objek[i].nomnunggak+=data[k].bayar_spp-data[k].tagihan_spp;
          }
          if(data[k].bayar_kegiatan<data[k].tagihan_kegiatan){
            objek[i].nunggak_kegiatan+=1;
            objek[i].nomnunggak_kegiatan+=data[k].bayar_kegiatan-data[k].tagihan_kegiatan;
            objek[i].nomnunggak+=data[k].bayar_kegiatan-data[k].tagihan_kegiatan;
          }
          if(data[k].bayar_seragam<data[k].tagihan_seragam){
            objek[i].nunggak_seragam+=1;
            objek[i].nomnunggak_seragam+=data[k].bayar_seragam-data[k].tagihan_seragam;
            objek[i].nomnunggak+=data[k].bayar_seragam-data[k].tagihan_seragam;
          }
          if(data[k].bayar_gedung<data[k].tagihan_gedung){
            objek[i].nunggak_gedung+=1;
            objek[i].nomnunggak_gedung+=data[k].bayar_gedung-data[k].tagihan_gedung;
            objek[i].nomnunggak+=data[k].bayar_gedung-data[k].tagihan_gedung;
          }
          
        }
      done=true;
      })
      deasync.loopWhile(function(){return !done;});
      
  }
  res.json(objek)
  // res.render('content-backoffice/index',{data:objek});
});
// app.get('/4E26CD6CB47148CCFB9334CB15B95495.txt', function (req, res) {
//   console.log(req.user)
//   //res.render('7ECA9DC7A2167A6EB33B60F1DA8B85E1.txt');
//   var file = __dirname + '/4E26CD6CB47148CCFB9334CB15B95495.txt';
//     res.download(file);
// });
// app.listen(800, function () {
//   console.log('Example app listening on port 800!');
//admin
//mysql

app.use(function (req, res, next) {
  res.status(404).send("Halaman yang anda tuju tidak ada!")
})
  
<!-- start socketio connection -->

io.sockets.on('connection', function (socket) {	



});