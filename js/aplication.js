$(document).ready(function () {

  /* INICIA AS SECTIONS OCULTAS */
  $('.step-two').hide();
  $('.step-three').hide();
  /* FIM */

  jQuery(function($){
    $('.next-step-one').click(function(){
      $('.step-two').show();
      $('.step-one').hide();
    });

    $('.btn-next').click(function(){
      $('.step-two').hide();
      $('.step-three').show();
    });
  });

  $(".back").click(function(){
    $(this).data("id");
  });

  /* VALIDA E-MAIL */
    $('#email').focusout(function(){
      email_validate();
    });
    function email_validate() {
      var pattern = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
      var email = $('#email').val();
      if(email !== '') {
        if(pattern.test(email)) {
          $('#lbl').css('color','white');
          $('#email').css('border','2px solid green'); 
          $('#success').css('display','block');
          $('#error').css('display','none');
          $('#warning').css('display','none');
          $('#span1').css('display','none');
          $('#span2').css('display','none');
        }else{
          $('#lbl').css('color','white');
          $('#email').css('border','2px solid red');
          $('#success').css('display','none');
          $('#error').css('display','block');
          $('#warning').css('display','none');
          $('#span1').css('display','block');
          $('#span2').css('display','none');
        }
      }else {
        $('#lbl').css('color','white');
        $('#email').css('border','2px solid orange');
        $('#success').css('display','none');
        $('#error').css('display','none');
        $('#warning').css('display','block');
        $('#span1').css('display','none');
        $('#span2').css('display','block');
      }
    }
  /* FIM VALIDA */ 
});
    

