/* CLASSES-2264 CLASSES-1319 NYU When neo templates are used, ensure the content pane matches the tool menu height */
$(function() {
  var $toolMenu = $("#toolMenu");
  var $portlet = $("#content");

  if ($portlet.length == 1) {
    $portlet.css("minHeight", $toolMenu.height() + "px");
  }
});