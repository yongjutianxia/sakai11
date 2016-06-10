CKEDITOR.addPluginLang = function( plugin, lang, obj )
{
    // v3 using feature detection
    if (CKEDITOR.skins)
    {
        var newObj = {};
        newObj[ plugin ] = obj;
        obj = newObj;
    }
    CKEDITOR.plugins.setLang( plugin, lang, obj );
}

CKEDITOR.addPluginLang('encodedimage','en',
	{
		'encodelabel':'Images uploaded here do not reside in the "Resources" folder and remain available even when questions are added to Question Pools or copied to another site.',
		'browseComputer':'Upload or Select from question pool images',
		'nourl':'Please select a local file first',
	}
);

