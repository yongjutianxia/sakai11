// Add addEventListener bindings for older browsers
// addEventListener polyfill 1.0 / Eirik Backer / MIT Licence
(function(win, doc){
	if(win.addEventListener)return;		//No need to polyfill

	function docHijack(p){var old = doc[p];doc[p] = function(v){return addListen(old(v))}}
	function addEvent(on, fn, self){
		return (self = this).attachEvent('on' + on, function(e){
			var e = e || win.event;
			e.preventDefault  = e.preventDefault  || function(){e.returnValue = false}
			e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true}
			fn.call(self, e);
		});
	}
	function addListen(obj, i){
		if(i = obj.length)while(i--)obj[i].addEventListener = addEvent;
		else obj.addEventListener = addEvent;
		return obj;
	}

	addListen([doc, win]);
	if('Element' in win)win.Element.prototype.addEventListener = addEvent;			//IE8
	else{																			//IE < 8
		doc.attachEvent('onreadystatechange', function(){addListen(doc.all)});		//Make sure we also init at domReady
		docHijack('getElementsByTagName');
		docHijack('getElementById');
		docHijack('createElement');
		addListen(doc.all);	
	}
})(window, document);


// Init the plugin dialog
(function() {
    CKEDITOR.dialog.add('magicembed', function(editor) {
        // Insert CSS
        var $css = document.createElement("link");
        $css.setAttribute("rel", "stylesheet");
        $css.setAttribute("type", "text/css");
        $css.setAttribute("href", editor.plugins.magicembed.path + "dialogs/magicembed.css");
        document.head.appendChild($css);

        var $dialog;

        var $embedHTML, $embedURL, $embedHeight, $embedWidth;

        var validateEmbedHTML = function(embedHTML) {
            if (embedHTML === null || embedHTML === "") {
                alert("Please enter some embed details");
                return false;
            }

            return true;
        };

        var getEmbedHTMLField = function() {
          return $dialog.getContentElement("magiciframeForm", "embedHTML").getInputElement().$;
        };

        var getEmbedURLField = function() {
          return $dialog.getContentElement("magiciframeForm", "embedURL").getInputElement().$;
        };

        var getEmbedHeightField = function() {
          return $dialog.getContentElement("magiciframeForm", "embedHeight").getInputElement().$;
        };

        var getEmbedWidthField = function() {
          return $dialog.getContentElement("magiciframeForm", "embedWidth").getInputElement().$;
        };

        return {
            title: editor.lang.magicembed.title,
            minWidth: 400,
            minHeight: 240,
            onShow: function() {
                $dialog = this;

                $dialog.parts.contents.$.className += " cke_magicembed_form ";

                getEmbedWidthField().setAttribute("placeholder", "in px (default: 640)");
                getEmbedHeightField().setAttribute("placeholder", "in px (default: 480)");

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
                    getEmbedURLField().setAttribute("disabled", "disabled");
                    getEmbedWidthField().setAttribute("disabled", "disabled");
                    getEmbedHeightField().setAttribute("disabled", "disabled");
                }

                var enableManualSettings = function() {
                  getEmbedURLField().removeAttribute("disabled");
                  getEmbedWidthField().removeAttribute("disabled");
                  getEmbedHeightField().removeAttribute("disabled");
                }

                var isManualSetting = function(id) {
                  return (getEmbedURLField().id == id) || (getEmbedWidthField().id == id) || (getEmbedHeightField().id == id);
                }

                var handleKeyup = function(event) {
                    var targetFieldId = event.target.getAttribute("id");
                    if (isManualSetting(targetFieldId)) {
                        populateIframe()
                    } else if (targetFieldId == getEmbedHTMLField().id) {
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
                $dialog = this;
                var embedHTML = getEmbedHTMLField().value;

                if (validateEmbedHTML(embedHTML)) {
                    this.getParentEditor().insertHtml("<br>" + embedHTML + "<br><br>");
                } else {
                    return false;
                }
            },
            contents: [{
                    label: editor.lang.common.generalTab,
                    id: 'magiciframeForm',
                    elements: [
                        {
                          type: 'html',
                          html: '<p class="warning">Be aware only certain sites may be embedded in NYU Classes.  Please contact <a href="mailto:askits@nyu.edu">askits@nyu.edu</a> if you have trouble embedding your content. <br><br>To ensure your content displays correctly, use "https" urls. For more information on insecure content, <a href="http://www.nyu.edu/servicelink/KB0010519" target="_blank">click here</a>.</p>'
                        },
                        {
                          type: 'html',
                          html: '<hr>'
                        },
                        {
                          type: 'html',
                          html: '<p>Enter embed fields individually (for an iframe):</p>'
                        },
                        {
                          type : 'text',
                          id : 'embedURL',
                          label : 'URL'
                        },
                        {
                          type : 'text',
                          id : 'embedWidth',
                          label : 'Width'
                        },
                        {
                          type : 'text',
                          id : 'embedHeight',
                          label : 'Height'
                        },
                        {
                          type : 'textarea',
                          id : 'embedHTML',
                          label: 'OR paste your embed code here:'
                        }
                    ]
                }]
        }
    });

})();
