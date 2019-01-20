// Activate the navbar menus
$(document).ready(function () {
  console.log("doc ready");
  $('.sidenav').sidenav();
  $('.dropdown-trigger').dropdown({ hover: false });
  $('.modal').modal();
});