/* CLASSES-2264 CLASSES-1319 NYU When neo templates are used,
   ensure the content pane matches the tool menu height
*/
$PBJQ(function() {
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
$PBJQ(function() {
  $PBJQ(".Mrphs-siteHierarchy").prepend("<a href='javascript:void' aria-hidden='true' id='nyuToolToggle'>Tools</a>");
  $PBJQ("#nyuToolToggle").on("click", toggleToolsNav);
});

// Setup banner logo to return to top of page upon click
$PBJQ(function() {
  $PBJQ(".Mrphs-headerLogo").on("click", function() {
    // only do this if in mobile view
    if ($PBJQ(".nyu-desktop-only:first").is(":not(:visible)")) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }
  });
});

// Ensure PASystem messages are visible on mobile
$PBJQ(function() {
  var $pasystem = $PBJQ(".pasystem-banner-alerts");

  function repositionHeaderBits() {
    $PBJQ(".Mrphs-headerLogo").css("top", $pasystem.height());
    $PBJQ(".Mrphs-portalWrapper .Mrphs-topHeader #loginLinks").css("top", $pasystem.height() + 13);
    $PBJQ(".Mrphs-topHeader").css("paddingTop", $pasystem.height() + $PBJQ(".Mrphs-headerLogo").height());
  }

  if ($PBJQ(".pasystem-banner-alert", $pasystem).length > 0) {
    repositionHeaderBits();
  }

  // resize upon show/hide of alerts
  $PBJQ(document.body).on("alertshown.pasystem alerthidden.pasystem", repositionHeaderBits);
});


// Introduce Option button for calendar and messages synoptic tool
// that invokes option link within the tool
$PBJQ(function() {
  $PBJQ("#synopticCalendarOptions").on("click", function() {
    var $portlet = $PBJQ(this).closest(".Mrphs-container.Mrphs-sakai-summary-calendar");
    var $iframe = $PBJQ(".Mrphs-toolBody.Mrphs-toolBody--sakai-summary-calendar iframe", $portlet);
    var $iframeBody = $PBJQ($iframe[0].contentWindow.document.body);

    // trigger the options link
    $PBJQ("#calendarForm .actionToolbar .firstToolBarItem a", $iframeBody).trigger("click");
  });

  $PBJQ("#synopticMessageCenterOptions").on("click", function() {
    var $portlet = $PBJQ(this).closest(".Mrphs-container.Mrphs-sakai-synoptic-messagecenter");
    var $iframe = $PBJQ(".Mrphs-toolBody.Mrphs-toolBody--sakai-synoptic-messagecenter iframe", $portlet);
    var $iframeBody = $PBJQ($iframe[0].contentWindow.document.body);

    // trigger the options link
    $PBJQ("#synopticForm #showOptions", $iframeBody).trigger("click");
  });

  $PBJQ("#synopticChatOptions").on("click", function() {
    var $portlet = $PBJQ(this).closest(".Mrphs-container.Mrphs-sakai-synoptic-chat");
    var $iframe = $PBJQ(".Mrphs-toolBody.Mrphs-toolBody--sakai-synoptic-chat iframe", $portlet);
    var $iframeBody = $PBJQ($iframe[0].contentWindow.document.body);

    // trigger the options link
    $PBJQ("#_id1 .actionToolbar .firstToolBarItem a", $iframeBody).trigger("click");
  });
});

// Bind a dummy touch event on document to stop iOS from capturing
// a click to enable a hover state
$PBJQ(document).on("touchstart", function() { return true; });


// Profile Image Edit/Upload Widget
$PBJQ(function() {
  $PBJQ(".Mrphs-userNav__submenuitem--profilelink, .edit-image-button").each(function() {
    var $profileLink = $PBJQ(this);

    var sakai_csrf_token = $PBJQ(this).data("csrf-token");

    // To avoid messing with Profile2 wicket javascript events,
    // create a dummy link that proxies to the original as a fallback
    // when needed.
    if ($profileLink.is(".edit-image-button")) {
      var $replacementLink = $PBJQ("<a>").attr("href", "javascript:void(0);").addClass("dummy-edit-image-button");
      $profileLink.after($replacementLink);
      $replacementLink.data("profileLink", $profileLink[0]);
      $profileLink.hide();
      $profileLink = $replacementLink;
    }

    $profileLink.on("click", function(event) {
      if (!window.FileReader) {
        // we need FileReader support to load the image for croppie
        // when browser doesn't support it, then fallback to old upload method
        $PBJQ($profileLink.data("profileLink")).trigger("click");
        return true;
      }

      if (!$PBJQ.fn.modal) {
        // we need Bootstrap
        // when not loaded fallback to the old upload method
        $PBJQ($profileLink.data("profileLink")).trigger("click");
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

      function resetProfileImage() {
        $modal.find(".modal-body .alert").remove();
  
        $PBJQ.ajax("/direct/profile-image/remove", {
          data: {
            sakai_csrf_token: sakai_csrf_token
          },
          type: 'POST',
          dataType: 'json',
          success: function(data, textStatus, jqXHR) {
            if (data.status == "SUCCESS") {
              var $success = $PBJQ("<div>").addClass("alert alert-success").text("Profile image successful removed. Please refresh the page for changes to take effect.");
              $modal.find(".modal-body").html($success);
              $save.remove();
              $modal.find(".modal-footer button.remove-profile-image").remove();
              $modal.find(".modal-footer button").text("Close");
            } else {
              var $error = $PBJQ("<div>").addClass("alert alert-danger").text("Error removing image");
              $modal.find(".modal-body").prepend($error);
            }
          }
        });
      }

      function showCroppie(url) {
        $croppie.show();
        $croppie.croppie("bind", {
          url: url
        }).then(function () {
          $save.removeProp("disabled");
          $croppie.croppie("setZoom", 0);
        });

        if ($modal.find(".rotate-profile-image").length == 0) {
          var $rotate = $("<a>").attr("href", "javascript:void(0);").addClass("rotate-profile-image");
          $rotate.on("click", function() {
            $croppie.croppie("rotate", 90);
          });
          $croppie.after($rotate);
        }
      }

      function loadExtistingProfileImage() {
        $PBJQ.getJSON("/direct/profile-image/details?_=" + new Date().getTime(), function(json) {
          if (json.status == "SUCCESS") {
            if (!json.isDefault) {
              showCroppie(json.url + "?_=" + new Date().getTime());
  
              var $remove = $PBJQ("<button>").addClass("btn btn-link remove-profile-image").addClass("pull-right").text("Remove");
              $modal.find(".modal-footer").append($remove);
              $remove.on("click", function() {
                resetProfileImage();
              });
            }
          }
        });
      };

      function uploadProfileImage(imageByteSrc) {
        $modal.find(".modal-body .alert").remove();
  
        $PBJQ.ajax("/direct/profile-image/upload", {
          data: {
            sakai_csrf_token: sakai_csrf_token,
            base64: imageByteSrc
          },
          type: 'POST',
          dataType: 'json',
          success: function(data, textStatus, jqXHR) {
            if (data.status == "SUCCESS") {
              var $success = $PBJQ("<div>").addClass("alert alert-success").text("Upload Successful. Please refresh the page for changes to take effect.");
              $modal.find(".modal-body").html($success);
              $save.remove();
              $modal.find(".modal-footer button.btn-danger").remove();
              $modal.find(".modal-footer button").text("Close");
            } else {
              var $error = $PBJQ("<div>").addClass("alert alert-danger").text("Error uploading image");
              $modal.find(".modal-body").prepend($error);
            }
          }
        });
      }

      // show popup!
      var $modal = $PBJQ('<div class="modal fade" id="profileImageUpload" tabindex="-1" role="dialog">'
                     +  '<div class="modal-dialog" role="document">'
                     +    '<div class="modal-content">'
                     +      '<div class="modal-header"><h3>Change Profile Picture</h3></div>'
                     +      '<div class="modal-body"></div>'
                     +      '<div class="modal-footer">'
                     +        '<button type="button" class="button_color pull-left" id="save" disabled="disabled">Save</button>'
                     +        '<button type="button" class="button pull-left" data-dismiss="modal">Cancel</button>'
                     +      '</div>'
                     +    '</div>'
                     +  '</div>'
                     +'</div>');
      $PBJQ(document.body).append($modal);
      var modalVisible = false;
      $modal.on("shown.bs.modal", function() {
        loadExtistingProfileImage();
      });
      $modal.modal({
        width: 320
      });

      var $save = $modal.find("#save");

      var $upload = $PBJQ('<a id="upload" class="button">'
                      + 'Upload'
                      +'</a>');
      var $fileUpload = $PBJQ('<input type="file" id="file" value="Choose a file" accept="image/*">');
      $upload.append($fileUpload);

      var $croppie = $PBJQ('<div id="croppie"></div>').hide();

      $modal.find(".modal-body").append($upload);
      $modal.find(".modal-body").append($croppie);

      $croppie.croppie({
        viewport: {
          width: 200,
          height: 200
        },
        enableExif: true,
        enableOrientation: true
      });

      $fileUpload.on("change", function() {
        var $this = $PBJQ(this);
          if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
              showCroppie(e.target.result);
            };
                  
            reader.readAsDataURL(this.files[0]);
          } else {
            throw "Browser does not support FileReader";
          }
      });

      $save.on('click', function (ev) {
        $croppie.croppie('result', {
          type: 'base64',
          size: 'viewport',
          format: 'png'
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