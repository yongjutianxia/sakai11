(function() {
    var MAGICEMBED_FORM_HTML = '<div>'
      + '<div id="cke_magicembed_form">'
      + '<p class="warning">Be aware only certain sites may be embedded in NYU Classes.  Please contact <a href="mailto:askits@nyu.edu">askits@nyu.edu</a> if you have trouble embedding your content. <br><br>To ensure your content displays correctly, use "https" urls. For more information on insecure content, <a href="http://www.nyu.edu/servicelink/KB0010519" target="_blank">click here</a>.</p>'
      + '<p>Enter embed fields individually (for an iframe):</p>'
      + '<div class="magicembed-input-group"><label for="embedURL">URL</label><input id="embedURL" placeholder="URL" tabindex="1"></div>'
      + '<div class="magicembed-input-group"><label for="embedWidth">Width</label><input id="embedWidth" placeholder="Width in px (default: 640)" tabindex="1"></div>'
      + '<div class="magicembed-input-group"><label for="embedHeight">Height</label><input id="embedHeight" placeholder="Height in px (default: 480)" tabindex="1"></div>'
      + '<p>OR paste your embed code here:</p>'
      + '<textarea id="embedHTML"></textarea>'
      + '</div>'
      + '</div>';

    CKEDITOR.dialog.add('magicembed', function(editor) {
        // Insert CSS
        var $css = document.createElement("link");
        $css.setAttribute("rel", "stylesheet");
        $css.setAttribute("type", "text/css");
        $css.setAttribute("href", "/library/editor/ckeditor/plugins/magicembed/dialogs/magicembed.css");
        document.head.appendChild($css);

        var MANUAL_SETTINGS = ["embedURL", "embedHeight", "embedWidth"];

        var $embedHTML, $embedURL, $embedHeight, $embedWidth;

        var validateEmbedHTML = function(embedHTML) {
            if (embedHTML === null || embedHTML === "") {
                alert("Please enter some embed details");
                return false;
            }

            return true;
        };

        var getEmbedHTMLField = function() {
          if ($embedHTML) return $embedHTML;

          return $embedHTML = document.getElementById("embedHTML");
        };

        var getEmbedURLField = function() {
          if ($embedURL) return embedURL;

          return $embedURL = document.getElementById("embedURL");
        };

        var getEmbedHeightField = function() {
          if ($embedHeight) return $embedHeight;

          return $embedHeight = document.getElementById("embedHeight");
        };

        var getEmbedWidthField = function() {
          if ($embedWidth) return $embedWidth;

          return $embedWidth = document.getElementById("embedWidth");
        };

        return {
            title: editor.lang.magicembed.title,
            minWidth: 300,
            minHeight: 240,
            onShow: function() {
                var populateIframe = function() {
                    getEmbedHTMLField().value = "";

                    if (getEmbedURLField().value != "") {
                        var $iframe = document.createElement("iframe");
                        var src = getEmbedURLField().value;
                        if (src.indexOf("://") < 0 && (src.indexOf("//") < 0 || src.indexOf("//") != 0)) {
                            src = "//" + src;
                        }
                        $iframe.setAttribute("src", src);
                        $iframe.setAttribute("height", getEmbedHeightField().value == "" ? 480 : getEmbedHeightField().value);
                        $iframe.setAttribute("width", getEmbedWidthField().value == "" ? 640 : getEmbedWidthField().value);

                        getEmbedHTMLField().value = $iframe.outerHTML;
                    }
                };

                var disableManualSettings = function() {
                    for (var i=0;i<MANUAL_SETTINGS.length;i++) {
                      var id = MANUAL_SETTINGS[i];
                      document.getElementById(id).setAttribute("disabled", "disabled");
                    }
                }

                var enableManualSettings = function() {
                  for (var i=0;i<MANUAL_SETTINGS.length;i++) {
                    var id = MANUAL_SETTINGS[i];
                    document.getElementById(id).removeAttribute("disabled");
                  }
                }

                var handleKeyup = function(event) {
                    var targetFieldId = event.target.getAttribute("id");
                    if (MANUAL_SETTINGS.indexOf(targetFieldId) != -1) {
                        populateIframe()
                    } else if (targetFieldId == "embedHTML") {
                        if (getEmbedHTMLField().value.trim() == "") {
                            return enableManualSettings();
                        }
                        try {
                            var $els = document.createElement("div");
                            $els.innerHTML = getEmbedHTMLField().value;
                            var $el = $els.childNodes[0];

                            if (!$el.tagName == "IFRAME") {
                                disableManualSettings();
                                return; 
                            } else {
                                enableManualSettings();
                                getEmbedURLField().value = $el.getAttribute("src");
                                getEmbedHeightField().value =  $el.getAttribute("height");
                                getEmbedWidthField().value =  $el.getAttribute("width");
                            }
                        } catch (e) {
                            enableManualSettings();
                        }
                    }
                };

                var resetForm = function() {
                    enableManualSettings();

                    getEmbedHTMLField().value = "";
                    getEmbedURLField().value = "";
                    getEmbedHeightField().value =  "";
                    getEmbedWidthField().value =  "";
                };

                resetForm();

                getEmbedHTMLField().addEventListener("keyup", function(event) {handleKeyup(event)});
                getEmbedURLField().addEventListener("keyup", function(event) {handleKeyup(event)});
                getEmbedHeightField().addEventListener("keyup", function(event) {handleKeyup(event)});
                getEmbedWidthField().addEventListener("keyup", function(event) {handleKeyup(event)});
            },
            onOk: function() {
                var embedHTML = getEmbedHTMLField().value;

                if (validateEmbedHTML(embedHTML)) {
                    this.getParentEditor().insertHtml("<br>" + embedHTML + "<br><br>");
                } else {
                    return false;
                }
            },
            contents: [{
                    label: editor.lang.common.generalTab,
                    id: 'general',
                    elements: [
                        {
                            type: 'html',
                            id: 'magiciframeForm',
                            html: MAGICEMBED_FORM_HTML
                        }
                    ]
                }]
        }
    });

})();
