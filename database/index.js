
/*
 * GET home page.
 */
// import database

 var mysql      = require('mysql');

module.exports.connection = mysql.createConnection({
  host     : 'fosan.id',
  user     : 'root',
  port	   : '3306',
  password : 'Grafika9',
  database : '2021_siti_sula'
});
