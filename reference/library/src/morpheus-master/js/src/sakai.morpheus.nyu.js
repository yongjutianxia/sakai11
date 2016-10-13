/* CLASSES-2264 CLASSES-1319 NYU When neo templates are used,
   ensure the content pane matches the tool menu height
*/
$(function() {
  var $toolMenu = $("#toolMenu");
  var $portlet = $("#content");

  if ($portlet.length == 1) {
    var menuHeight = $toolMenu.height();

    // CLASSES-2316 We want to ensure the footer is planted at the bottom
    // of the windows so ensure the min-height of the portlet panel is enough
    // to do this
    if ($(document.body).height() < $(window).height()) {
      var footerHeight = $("#footer").outerHeight();
      var headerHeight = $portlet.offset().top;
      var calculatedHeight = $(window).height() - headerHeight -  footerHeight;

      menuHeight = Math.max(menuHeight, calculatedHeight);
    }

    $portlet.css("minHeight", menuHeight + "px");
  }
});