$(document).ready(function(){
  $('.user-section').click(function() {
    $('.user-menu').fadeIn('fast').focus().blur(function() {
      setTimeout(function() {
        $('.user-menu').hide();
      }, 200);
    });
  });
});
