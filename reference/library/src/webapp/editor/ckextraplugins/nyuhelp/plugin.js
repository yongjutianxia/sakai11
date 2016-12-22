(function() {
  var HELP_LINK = 'http://www.nyu.edu/servicelink/041226809455967';
  var PLUGIN_NAME = 'nyuhelp';

  var HELP_COMMAND = {
    exec: function(editor) {
      window.open(HELP_LINK);
      return;
    }
  };

  CKEDITOR.plugins.add( PLUGIN_NAME, {
    init: function( editor ) {
      editor.addCommand( PLUGIN_NAME, HELP_COMMAND );
      editor.ui.addButton && editor.ui.addButton(PLUGIN_NAME, {
        label: 'Help',
        command: PLUGIN_NAME
      });
    }
  });
})();
