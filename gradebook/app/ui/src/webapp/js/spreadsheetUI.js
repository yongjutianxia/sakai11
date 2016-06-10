/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.12
 *
 * Requires: jQuery 1.2.2+
 */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?module.exports=a:a(jQuery)}(function(a){function b(b){var g=b||window.event,h=i.call(arguments,1),j=0,l=0,m=0,n=0,o=0,p=0;if(b=a.event.fix(g),b.type="mousewheel","detail"in g&&(m=-1*g.detail),"wheelDelta"in g&&(m=g.wheelDelta),"wheelDeltaY"in g&&(m=g.wheelDeltaY),"wheelDeltaX"in g&&(l=-1*g.wheelDeltaX),"axis"in g&&g.axis===g.HORIZONTAL_AXIS&&(l=-1*m,m=0),j=0===m?l:m,"deltaY"in g&&(m=-1*g.deltaY,j=m),"deltaX"in g&&(l=g.deltaX,0===m&&(j=-1*l)),0!==m||0!==l){if(1===g.deltaMode){var q=a.data(this,"mousewheel-line-height");j*=q,m*=q,l*=q}else if(2===g.deltaMode){var r=a.data(this,"mousewheel-page-height");j*=r,m*=r,l*=r}if(n=Math.max(Math.abs(m),Math.abs(l)),(!f||f>n)&&(f=n,d(g,n)&&(f/=40)),d(g,n)&&(j/=40,l/=40,m/=40),j=Math[j>=1?"floor":"ceil"](j/f),l=Math[l>=1?"floor":"ceil"](l/f),m=Math[m>=1?"floor":"ceil"](m/f),k.settings.normalizeOffset&&this.getBoundingClientRect){var s=this.getBoundingClientRect();o=b.clientX-s.left,p=b.clientY-s.top}return b.deltaX=l,b.deltaY=m,b.deltaFactor=f,b.offsetX=o,b.offsetY=p,b.deltaMode=0,h.unshift(b,j,l,m),e&&clearTimeout(e),e=setTimeout(c,200),(a.event.dispatch||a.event.handle).apply(this,h)}}function c(){f=null}function d(a,b){return k.settings.adjustOldDeltas&&"mousewheel"===a.type&&b%120===0}var e,f,g=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],h="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],i=Array.prototype.slice;if(a.event.fixHooks)for(var j=g.length;j;)a.event.fixHooks[g[--j]]=a.event.mouseHooks;var k=a.event.special.mousewheel={version:"3.1.12",setup:function(){if(this.addEventListener)for(var c=h.length;c;)this.addEventListener(h[--c],b,!1);else this.onmousewheel=b;a.data(this,"mousewheel-line-height",k.getLineHeight(this)),a.data(this,"mousewheel-page-height",k.getPageHeight(this))},teardown:function(){if(this.removeEventListener)for(var c=h.length;c;)this.removeEventListener(h[--c],b,!1);else this.onmousewheel=null;a.removeData(this,"mousewheel-line-height"),a.removeData(this,"mousewheel-page-height")},getLineHeight:function(b){var c=a(b),d=c["offsetParent"in a.fn?"offsetParent":"parent"]();return d.length||(d=a("body")),parseInt(d.css("fontSize"),10)||parseInt(c.css("fontSize"),10)||16},getPageHeight:function(b){return a(b).height()},settings:{adjustOldDeltas:!0,normalizeOffset:!0}};a.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})});


var el1, el2, els = null;
adjustScrolls = function(){
   el1.style.left = -els.scrollLeft + 'px';
   el2.style.top = -els.scrollTop + 'px';
}

function gethandles(){
   q2_div_ul = $("#q2 div ul");
   q4s = $("#q4");
   q3_div = $("#q3 div");
   q3_div_table = $("#q3 div table");
   q1_width = $("#q1").width();
   q2_ul_li = $("#q2 div ul li");
   q3_top_row = $("#q3 tr:first td");
   q4_top_row = $("#q4 tr:first td");
   $(q3_div).width(10000);
   $("#q1 div").width(10000);

   paddingRight = parseInt($("#q1 li:first").css("padding-right"));
   add = 0;
   $("#q1 li").each(function(i){
      this_width = $(this).width() + paddingRight *2;
      q3_tr_td = $(q3_top_row).get(i);
      match_width = $(q3_tr_td).width() + 10;
      new_width = (match_width < this_width ? this_width : match_width);
     $(q3_tr_td).width(new_width - paddingRight * 2);
     $(this).width(new_width - paddingRight * 2 - 2);
   });
   q1_width = $("#q1").width();
   $(q3_div).width(q1_width);
   
   // #q2 contains the "data" headers that contain the assignment titles
   // the structure is #q2 div:div:ul:li.  #q4 is the table that contains the grade info
   
   total = 0; count = 0;
   $(q2_ul_li).each(function(c){
	   var q2_heading_width = $(this).width() + paddingRight *2;
	   // make sure all of the assignment name headers have a minimum width
	   if(q2_heading_width < 50) {
		   q2_heading_width = 45;
	   }

	   q4_tr_td = $("#q4 tr:first td:eq(" + c + ")");
	   q4_data_width = $(q4_tr_td).width() + 20;
	   new_width = (q4_data_width < q2_heading_width ? q2_heading_width : q4_data_width);
	   $(q4_tr_td).width(new_width);
	   $(this).width(new_width);       

	   total += new_width + paddingRight * 2; count=c+1;
   });
   
   // now we need to set the width of the header section and the associated
   // table containing the grade data
   total += count * 2;
   q4_table = $("#q4 table")
   q4_table_width = total;
   $(q4_table).width(total);
   $(q2_div_ul).width(total);
   q4_table_width = total;
   
   // this makes sure the height of the data cells matches up for all rows
   $("#q3 tr").each(function(i){
      thisHeight = $(this).height();
      thatHeight = $("#q4 tr:eq(" + i + ")").height();
      if(thisHeight > thatHeight){
         $("#q4 tr:eq(" + i + ")").height(thisHeight);
      } else {
         $(this).css("height",thatHeight + "px");
      }
   });
   
   //check if we need scrollbars - SAK-9969
   
   q4_div = $("#q4 div");

   var q4s_width = $(q4s).width();
    if (q4s_width > q4_table_width) {
      var mainwrap = $("#mainwrap");
      maxwidth = $(mainwrap).width() - (q4s_width - q4_table_width) + 15;
        if(maxwidth < $("body").width() - 2) 
      $(mainwrap).css("max-width", maxwidth);
   }
   
   var q4s_height = $(q4s).height();
   var q4_table_height = $(q4_table).height();
   if(q4_table_height < q4s_height){  
      q3s = $("#q3");   
      $(q3s).height($(q3s).height() - (q4s_height - q4_table_height) + 15);
      $(q4_div).height($(q4_div).height() - (q4s_height - q4_table_height) + 15);
   }
   //end check if we need scrollbars - SAK-9969


   el1 = $(q2_div_ul).get(0);
   el2 = $("#q3 div table").get(0);
   els = $(q4_div).get(0);
   $(q4_div).scroll(adjustScrolls);
}
$(document).ready(gethandles);


// Bind a mouse wheel listener for the left hand pane so scrolling works consistently.
$(function () {

    var reset_row_heights = function () {
      $("#q3 tr").each(function(i){
          thisHeight = $(this).height();
          thatHeight = $("#q4 tr:eq(" + i + ")").height();

          var new_height = Math.max(thisHeight, thatHeight) + 5;

          $("#q4 tr:eq(" + i + ")").height(new_height);
          $(this).height(new_height);
        })

      // If we're not showing a scrollbar (such as on OSX), make set
      // the heights to take up the full space available
      var q3_div = $('#q3 > div');
      var q4_div = $('#q4 > div');

      if (q4_div.height() === q4_div[0].clientHeight) {
        // what a world.
        q3_div.height(q4_div.height());
      }
    };
     
    reset_row_heights();
    // setInterval(reset_row_heights, 1000);


    var divToScroll = $('#q4 > div');

    // This function checks if the specified event is supported by the browser.
    // Source: http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
    function isEventSupported(eventName) {
        var el = document.createElement('div');
        eventName = 'on' + eventName;
        var isSupported = (eventName in el);
        if (!isSupported) {
            el.setAttribute(eventName, 'return;');
            isSupported = typeof el[eventName] == 'function';
        }
        el = null;
        return isSupported;
    }

    $('#q3,#q4').on('mousewheel', function(event) {
        var leftPosition = divToScroll.scrollLeft();
        var topPosition = divToScroll.scrollTop();

        // Pass the scroll to the other pane
        if (event.deltaX) {
          divToScroll.scrollLeft(leftPosition + (event.deltaX * event.deltaFactor));
        }
        
        if (event.deltaY) {
          divToScroll.scrollTop(topPosition - (event.deltaY * event.deltaFactor));
        }

        event.preventDefault();
        return false;
    });
});
