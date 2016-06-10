(function() {
    var magicembedCmd= {
        exec: function(editor){
            editor.openDialog('magicembed');
            return
        }
    };

    CKEDITOR.plugins.add('magicembed',
                         {
                             lang:['en'],
                             requires:['dialog'],
                             init: function(editor){
                                 var commandName='magicembed';
                                 editor.addCommand(commandName,magicembedCmd);
                                 editor.ui.addButton('magicembed', 
                                                     {
                                                        label: editor.lang.magicembed.title,
                                                        command: commandName,
                                                        icon: this.path+"images/magicembed_bw.png"
                                                     });
                                 CKEDITOR.dialog.add(commandName, CKEDITOR.getUrl(this.path+'dialogs/magicembed.js'));
                             }
                         });
})();
