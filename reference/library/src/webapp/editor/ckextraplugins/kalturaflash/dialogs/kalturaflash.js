(function(){
   CKEDITOR.dialog.add('kalturaflash', function(editor) {
       return {
           title: editor.lang.kalturaflash.title,
           minWidth: 300,
           minHeight: 200,
           onShow: function() {
               this.getContentElement('general','content').getInputElement().setValue('');
           },
           onOk: function() {
                var $this = this;
                var val = this.getContentElement('general','content').getInputElement().getValue();

                if (val === null || val === "") {
                    alert(editor.lang.kalturaflash.missingCodeMsg);
                    return false;
                }

                // insert into the editor pane
                $this.getParentEditor().insertHtml("<br>"+val+"<br><br>");

            },
            contents:[{
                label: editor.lang.common.generalTab,
                id: 'general',
                elements: [
                    {
                        type: 'html',
                        id: 'pasteMsg',
                        html: '<div style="white-space:normal;width:500px;">'+editor.lang.kalturaflash.pasteMsg+'</div>'
                    }, 
                    {
                        type: 'html',
                        id: 'content',
                        style: 'width:300px;height:120px',
                        html: '<textarea rows="6" style="width: 100%; border:1px solid black; background:white">',
                        focus: function() {
                            this.getElement().focus();
                        }
                    }
                ]
            }]
        }
    });
})();
