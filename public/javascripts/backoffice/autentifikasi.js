$.getJSON( "/user/verifikasi", function( data ) {
//    console.log(data);
   if(data.user.sekolah){
       $('.approval').hide()
   }
  });