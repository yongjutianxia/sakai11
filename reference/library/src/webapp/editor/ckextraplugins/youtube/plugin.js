(function() {
	var commandName='youtube';

	var youtubeCmd = {
		exec: function(editor) {
			editor.openDialog(commandName);
			return;
		}
	};

	CKEDITOR.plugins.add('youtube', {
		lang:['en'],
		requires:['dialog'],
		init: function(editor) {
			editor.addCommand(commandName, youtubeCmd);
			editor.ui.addButton('Youtube', {
				label: editor.lang.youtube.button,
				command: commandName,
				icon: this.path+"images/youtube_bw.png"
			});
			CKEDITOR.dialog.add(commandName, CKEDITOR.getUrl(this.path+'dialogs/youtube.js'));
		}
	});

})();
