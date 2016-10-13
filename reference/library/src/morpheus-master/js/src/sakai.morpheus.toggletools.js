/**
* For toggling the Minimize and Maximize tools menu in Morpheus.
*/

function toggleMinimizeNav(){
  $PBJQ('body').toggleClass('Mrphs-toolMenu-collapsed');

  var isCollapsed = $PBJQ('body').hasClass('Mrphs-toolMenu-collapsed');

  var el = $PBJQ(this);

  if (isCollapsed) {
    el.attr('title', (el.data("title-expand")));
    el.attr('aria-pressed', false);
    document.cookie = "sakai_nav_minimized=true; path=/";
  } else {
    el.attr('title', (el.data("text-original")));
    el.attr('aria-pressed', true);
    document.cookie = "sakai_nav_minimized=false; path=/";
  }
}

$PBJQ(".js-toggle-nav").on("click", toggleMinimizeNav);

/* Backport SAK-31456 */
$PBJQ(document).ready(function(){
  if(getCookieVal('sakai_nav_minimized') === 'true') {
    $PBJQ(".js-toggle-nav").click();
  }
});

function getCookieVal(cookieName) {
  var cks = document.cookie.split(';');
  for (var i = 0; i < cks.length; ++i) {
    var curCookie = (cks[i].substring(0,cks[i].indexOf('='))).trim();
    if(curCookie === cookieName) {
      return ((cks[i].split('='))[1]).trim();;
    }
  }
  return undefined;
}
