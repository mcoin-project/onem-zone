// Activate the navbar menus
$(document).ready(function () {
  console.log("doc ready");
  $('#services-target').sidenav({
    edge: 'right'
  });
  $('#mobile-demo-left').sidenav();
  $('.dropdown-trigger').dropdown({ hover: false });
  $('.modal').modal();
});