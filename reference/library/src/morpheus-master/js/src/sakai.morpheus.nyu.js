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


// Introduce Option button for calendar and messages synoptic tool
// that invokes option link within the tool
$(function() {
  $("#synopticCalendarOptions").on("click", function() {
    var $portlet = $(this).closest(".Mrphs-container.Mrphs-sakai-summary-calendar");
    var $iframe = $(".Mrphs-toolBody.Mrphs-toolBody--sakai-summary-calendar iframe", $portlet);
    var $iframeBody = $($iframe[0].contentWindow.document.body);

    // trigger the options link
    $("#calendarForm .actionToolbar .firstToolBarItem a", $iframeBody).trigger("click");
  });

  $("#synopticMessageCenterOptions").on("click", function() {
    var $portlet = $(this).closest(".Mrphs-container.Mrphs-sakai-synoptic-messagecenter");
    var $iframe = $(".Mrphs-toolBody.Mrphs-toolBody--sakai-synoptic-messagecenter iframe", $portlet);
    var $iframeBody = $($iframe[0].contentWindow.document.body);

    // trigger the options link
    $("#synopticForm #showOptions", $iframeBody).trigger("click");
  });

  $("#synopticChatOptions").on("click", function() {
    var $portlet = $(this).closest(".Mrphs-container.Mrphs-sakai-synoptic-chat");
    var $iframe = $(".Mrphs-toolBody.Mrphs-toolBody--sakai-synoptic-chat iframe", $portlet);
    var $iframeBody = $($iframe[0].contentWindow.document.body);

    // trigger the options link
    $("#_id1 .actionToolbar .firstToolBarItem a", $iframeBody).trigger("click");
  });
});

// Bind a dummy touch event on document to stop iOS from capturing
// a click to enable a hover state
$PBJQ(document).on("touchstart", function() { return true; });


// Profile Image Edit/Upload Widget
$PBJQ(function() {
  $PBJQ(".Mrphs-userNav__submenuitem--profilelink, .edit-image-button").each(function() {
    var $profileLink = $(this);

    $profileLink.on("click", function(event) {
      if (!window.FileReader) {
        // we need FileReader support to load the image for croppie
        // when browser doesn't support it, then fallback to old upload method
        return true;
      }

      if (!$PBJQ.fn.modal) {
        // we need Bootstrap
        // when not loaded fallback to the old upload method
        return true;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      // include croppie (unless already added)
      if (!$PBJQ.fn.croppie) {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "/library/js/croppie/croppie.min.js?_=2.4.0";
        $PBJQ("head").append(s);

        //<link rel="Stylesheet" type="text/css" href="croppie.css">
        var l = document.createElement("link");
        l.type = "text/css";
        l.rel = "Stylesheet";
        l.href = "/library/js/croppie/croppie.css?_=2.4.0";
        $PBJQ("head").append(l);
      }

      // show popup!
      var $modal = $('<div class="modal fade" id="profileImageUpload" tabindex="-1" role="dialog">'
                     +  '<div class="modal-dialog" role="document">'
                     +    '<div class="modal-content">'
                     +      '<div class="modal-header"><h3>Change Profile Picture</h3></div>'
                     +      '<div class="modal-body"></div>'
                     +      '<div class="modal-footer">'
                     +        '<button type="button" class="button_color" id="save" disabled="disabled">Save</button>'
                     +        '<button type="button" class="button" data-dismiss="modal">Cancel</button>'
                     +      '</div>'
                     +    '</div>'
                     +  '</div>'
                     +'</div>');
      $PBJQ(document.body).append($modal);
      $modal.modal({
        width: 320
      });

      var $save = $modal.find("#save");

      var $upload = $('<a id="upload" class="button">'
                      + 'Upload'
                      +'</a>');
      var $fileUpload = $('<input type="file" id="file" value="Choose a file" accept="image/*">');
      $upload.append($fileUpload);

      var $croppie = $('<div id="croppie"></div>').hide();

      $modal.find(".modal-body").append($upload);
      $modal.find(".modal-body").append($croppie);

      $croppie.croppie({
        viewport: {
          width: 200,
          height: 200
        },
        enableExif: true
      });

      function uploadProfileImage(imageByteSrc) {
        $modal.find(".modal-body .alert").remove();
  
        $.ajax("/direct/profile-image/upload", {
          data: {
            sakai_csrf_token: $profileLink.data("csrf-token"),
            base64: imageByteSrc
          },
          type: 'POST',
          dataType: 'json',
          success: function(data, textStatus, jqXHR) {
            if (data.status == "SUCCESS") {
              var $success = $("<div>").addClass("alert alert-success").text("Upload Successful. Please refresh the page for changes to take effect.");
              $modal.find(".modal-body").html($success);
              $save.remove();
              $modal.find(".modal-footer button").text("Close");
            } else {
              var $error = $("<div>").addClass("alert alert-danger").text("Error uploading image");
              $modal.find(".modal-body").prepend($error);
            }
          }
        });
      }

      $fileUpload.on("change", function() {
        var $this = $(this);
          if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
              $croppie.show();
              $croppie.croppie('bind', {
                url: e.target.result
              });
              $save.removeProp("disabled");
            };
                  
            reader.readAsDataURL(this.files[0]);
          } else {
            throw "Browser does not support FileReader";
          }
      });

      $save.on('click', function (ev) {
        $croppie.croppie('result', {
          type: 'base64',
          size: 'viewport'
        }).then(function (src) {
          uploadProfileImage(src.replace(/^data:image\/(png|jpg);base64,/, ''));
        });
      });

      $modal.on("hidden.bs.modal", function() {
          $modal.remove();
      });

      return false;
    });
  });
});