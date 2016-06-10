(function(){
	var commandName='audio';

  var audioPluginCmd = {
    exec: function(editor) {
      editor.openDialog(commandName);
      return
    }
  };

  CKEDITOR.plugins.add( 'audio',
                        {
                          lang:['en'],
                          requires:['dialog'],
                          init:function(editor){ 
                            editor.addCommand(commandName, audioPluginCmd);
                            editor.ui.addButton('Audio', {
                              label: editor.lang.audio.button,
                              command: commandName,
                              icon: "/library/image/sakai/audio_bw.gif"
                            });
                            CKEDITOR.dialog.add(commandName, CKEDITOR.getUrl(this.path+'dialogs/audio.js'));
                          }
                        });
})();
