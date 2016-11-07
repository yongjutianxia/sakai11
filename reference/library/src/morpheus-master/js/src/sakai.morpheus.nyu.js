/* CLASSES-2264 CLASSES-1319 NYU When neo templates are used,
   ensure the content pane matches the tool menu height
*/
$(function() {
  var $toolMenu = $PBJQ("#toolMenu");
  var $portlet = $PBJQ("#content");

  if ($portlet.length == 1) {
    var menuHeight = $toolMenu.height();

    // CLASSES-2316 We want to ensure the footer is planted at the bottom
    // of the windows so ensure the min-height of the portlet panel is enough
    // to do this
    if ($PBJQ(document.body).height() < $PBJQ(window).height()) {
      var footerHeight = $PBJQ("#footer").outerHeight();
      var headerHeight = $portlet.offset().top;
      var calculatedHeight = $PBJQ(window).height() - headerHeight -  footerHeight;

      menuHeight = Math.max(menuHeight, calculatedHeight);
    }

    $portlet.css("minHeight", menuHeight + "px");
  }
});

// Allow custom tool button to toggle tool nav too
$(function() {
  $PBJQ(".Mrphs-siteHierarchy").prepend("<a href='javascript:void' aria-hidden='true' id='nyuToolToggle'>Tools</a>");
  $PBJQ("#nyuToolToggle").on("click", toggleToolsNav);
});

// Setup banner logo to return to top of page upon click
$(function() {
  $PBJQ(".Mrphs-headerLogo").on("click", function() {
    // only do this if in mobile view
    if ($(".nyu-desktop-only:first").is(":not(:visible)")) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }
  });
});

// Ensure PASystem messages are visible on mobile
$(function() {
  var $pasystem = $(".pasystem-banner-alerts");

  function repositionHeaderBits() {
    $(".Mrphs-headerLogo").css("top", $pasystem.height());
    $(".Mrphs-portalWrapper .Mrphs-topHeader #loginLinks").css("top", $pasystem.height() + 13);
    $(".Mrphs-topHeader").css("paddingTop", $pasystem.height() + $(".Mrphs-headerLogo").height());
  }

  if ($(".pasystem-banner-alert", $pasystem).length > 0) {
    repositionHeaderBits();
  }

  // resize upon show/hide of alerts
  $(document.body).on("alertshown.pasystem alerthidden.pasystem", repositionHeaderBits);
});


// Introduce Option button for calendar synoptic tool that invokes option link within the tool
$(function() {
  $("#synopticCalendarOptions").on("click", function() {
    var $portlet = $(this).closest(".Mrphs-container.Mrphs-sakai-summary-calendar");
    var $iframe = $(".Mrphs-toolBody.Mrphs-toolBody--sakai-summary-calendar iframe", $portlet);
    var $iframeBody = $($iframe[0].contentWindow.document.body);

    // trigger the options link
    $("#calendarForm .actionToolbar .firstToolBarItem a", $iframeBody).trigger("click");
  });
});