(function() {
  var kalturaFlashCmd = {
      exec: function(editor) {
              editor.openDialog('kalturaflash');
              return;
            }
  };

  CKEDITOR.plugins.add('kalturaflash',{
                                  lang: ['en'],
                                  requires: ['dialog'],
                                  init: function(editor) {
                                     var commandName='kalturaflash';
                                     editor.addCommand(commandName,kalturaFlashCmd);
                                     editor.ui.addButton('kalturaflash', {
                                       label: editor.lang.kalturaflash.button,
                                       command: commandName,
                                       icon: this.path+"images/nyustream_bw.png"
                                      });
                                     CKEDITOR.dialog.add( commandName,
                                                          CKEDITOR.getUrl(this.path+'dialogs/kalturaflash.js')
                                                        )
                                  }
                                })
})();
