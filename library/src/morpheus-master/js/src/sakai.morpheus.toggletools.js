/**
* For toggling the Minimize and Maximize tools menu in Morpheus: Adds classes to the <body> and changes the label text for accessibility
*/

function toggleMinimizeNav(){

  $PBJQ('body').toggleClass('Mrphs-toolMenu-collapsed');
  // Remove any popout div for subsites.  Popout only displayed when portal.showSubsitesAsFlyout is set to true.
  $PBJQ('#subSites.floating').css({'display': 'none'});

  var el = $PBJQ(this);
  var label = $PBJQ('.accessibility-btn-label' , el);

  if (label.text() == el.data("title-expand")) {
    label.text(el.data("text-original"));
    el.attr('title', (el.data("text-original")));
    el.attr('aria-pressed', true);
  } else {
	document.cookie = "sakai_nav_minimized=true; path=/";
	collapsed = true;
	el.data("text-original", label.text());
    label.text(el.data("title-expand"));
    el.attr('title', (el.data("title-expand")));
    el.attr('aria-pressed', false);
  }
}

$PBJQ(".js-toggle-nav").on("click", toggleMinimizeNav);
