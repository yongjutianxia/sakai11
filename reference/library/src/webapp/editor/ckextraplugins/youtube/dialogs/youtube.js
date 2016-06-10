(function(){
   if (typeof(jQuery) === 'undefined') {
     CKEDITOR.scriptLoader.load('/library/js/jquery.js');
   }

   CKEDITOR.dialog.add('youtube', function(editor) {
       return{
           title: editor.lang.youtube.title,
           minWidth: 300,
           minHeight: 240,
           onShow: function() {
               this.getContentElement('general','content').getInputElement().setValue('');
               this.getContentElement('general','content').getInputElement().setAttribute("placeholder", "e.g. http://www.youtube.com/watch?v=XXXXX");
           },
           onOk: function() {
                var $this = this;
                val = this.getContentElement('general','content').getInputElement().getValue();

                if (val === null || val === "") {
                    alert("Please provide a Youtube URL e.g. http://www.youtube.com/watch?v=XXXX");
                    return false;
                }

                var result = true;

                // hit youtubes oEmbed service
                $.ajax({
                    url: "/portal/youtube", 
                    type: "GET",
                    dataType: "json",
                    async: false,
                    data: {
                        "movie": val
                    },
                    success: function(data) {
                        if (typeof data != "object" || !data.hasOwnProperty("ref0") || !data["ref0"].hasOwnProperty("data")) {
                           alert("Error retrieving Youtube data for this video: "+val); 
                           result = false;
                        }
                        $this.getParentEditor().insertHtml(data["ref0"]["data"]["html"]);
                    },
                    error: function() {
                        alert("Error retrieving Youtube data for for this video: "+val);
                        result = false;
                    }
                });

                return result;
            },
            contents:[{
                label: editor.lang.common.generalTab,
                id: 'general',
                elements: [
                    {
                        type: 'html',
                        id: 'pasteMsg',
                        html: '<div style="white-space:normal;width:500px;"><img style="margin:5px auto;" src="'
                            +CKEDITOR.getUrl(CKEDITOR.plugins.getPath('youtube')
                            +'images/youtube_large.png')
                            +'"><br />'+editor.lang.youtube.pasteMsg
                            +'</div>'
                    }, 
                    {
                        type: 'html',
                        id: 'content',
                        style: 'width:340px;height:90px',
                        html: '<input size="100" style="'+'border:1px solid black;'+'background:white">',
                        focus: function() {
                            this.getElement().focus();
                        }
                    }
                ]
            }]
        }
    });
})();
