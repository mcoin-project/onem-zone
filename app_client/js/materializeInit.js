// Activate the navbar menus
$(document).ready(function () {
  console.log("doc ready");
  $('#services-target').sidenav({
    edge: 'right'
  }).on('click tap', 'li a', () => {
    $('.sidenav').sidenav('close');
  });
  $('#mobile-demo-left').sidenav().on('click tap', 'li a', () => {
    $('.sidenav').sidenav('close');
  });
  $('.dropdown-trigger').dropdown({ hover: false, coverTrigger: false });
  $('.dropdown-trigger-services').dropdown({ constrainWidth: false, hover: false, coverTrigger: false });

 // $('.modal').modal();
  $('.collapsible').collapsible();
});
