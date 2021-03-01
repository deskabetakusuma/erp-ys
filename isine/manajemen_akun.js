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
  res.render('content-backoffice/manajemen_aset/list'); 
});

router.get('/aset/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_aset/insert'); 
});

router.get('/aset/edit/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_aset/edit'); 
});

// hutang
router.get('/hutang', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_hutang/list'); 
});

router.get('/hutang/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_hutang/insert'); 
});

router.get('/hutang/edit/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_hutang/edit'); 
});

// modal
router.get('/modal', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_modal/list'); 
});

router.get('/modal/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_modal/insert'); 
});

router.get('/modal/edit/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_modal/edit'); 
});

// pendapatan
router.get('/pendapatan', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_pendapatan/list'); 
});

router.get('/pendapatan/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_pendapatan/insert'); 
});

router.get('/pendapatan/edit/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_pendapatan/edit'); 
});

// beban
router.get('/beban', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_beban/list'); 
});

router.get('/beban/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_beban/insert'); 
});

router.get('/beban/edit/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_beban/edit'); 
});

//objek
router.get('/objek', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_objek/list'); 
});

router.get('/objek/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_objek/insert'); 
});

router.get('/objek/edit/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_objek/edit'); 
});
module.exports = router;
