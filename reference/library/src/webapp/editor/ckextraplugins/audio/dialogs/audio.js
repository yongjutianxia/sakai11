(function(){
   CKEDITOR.dialog.add('audio', function(editor) {
       return{
           title: editor.lang.audio.title,
           minWidth: 300,
           minHeight: 100,
           onShow: function() {
              this.getContentElement('general','title').getInputElement().setValue('');
              this.getContentElement('general','url').getInputElement().setValue('');
           },
           onOk: function() {
                var $this = this;
                var url = this.getContentElement('general','url').getInputElement().getValue();

                if (url === null || url === "") {
                    alert("Please provide a URL");
                    return;
                }

                var title = this.getContentElement('general','title').getInputElement().getValue();

                var html = "<div><br /></div>";

                if (title.length > 0) {
                  html += "<div><strong>";
                  html += title;
                  html += "</strong></div>";
                } 

                html += '<object type="application/x-shockwave-flash" data="/player_mp3.swf" width="200" height="20">'
                          + '<param name="movie" value="/player_mp3.swf" />'
                          + '<param name="bgcolor" value="#ffffff" />'
                          + '<param name="FlashVars" value="mp3=' + url + '" />'
                          + '<img src="/library/editor/ckeditor/plugins/flash/images/placeholder.png"/>'
                        + '</object>';

                html += '<div><br/></div>';

                $this.getParentEditor().insertHtml(html);
            },
            contents:[{
                label: editor.lang.common.generalTab,
                id: 'general',
                elements: [
                    {
                        type: 'html',
                        id: 'titleMsg',
                        html: '<div style="white-space:normal;">'
                              + editor.lang.audio.titleMsg
                              + '</div>'
                    },
                    {
                        type: 'html',
                        id: 'title',
                        style: 'width:300px;height:90px',
                        html: '<input size="80" style="'+'border:1px solid black;'+'background:white">',
                        focus: function() {
                            this.getElement().focus();
                        }
                    },
                    {
                        type: 'html',
                        id: 'pasteMsg',
                        html: '<div style="white-space:normal;">'
                              + editor.lang.audio.urlMsg
                              + '</div>'
                    },
                    {
                        type: 'html',
                        id: 'url',
                        style: 'width:300px;height:90px',
                        html: '<input size="80" style="'+'border:1px solid black;'+'background:white">'
                    }
                ]
            }]
        }
    })
})();
