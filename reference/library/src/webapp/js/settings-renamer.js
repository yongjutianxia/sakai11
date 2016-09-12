var OLD_TOOL_LABEL = 'Settings';
var SETTINGS_TOOL_LABEL = 'Site Groups';

function renameSettingsToJoinable(title) {
    if (showSiteInfoAsSettings || title != OLD_TOOL_LABEL) {
        return title;
    } else {
        return SETTINGS_TOOL_LABEL;
    }
}


var findSettingsMenuLink = function () {
    var elt = $('.icon-sakai-siteinfo').closest('.Mrphs-toolsNav__menuitem--link');

    if (elt.length > 0) {
        return elt;
    } else {
        return undefined;
    }
};

var switchToJoinableGroups = function (link) {
    var title = $(link).find('.Mrphs-toolsNav__menuitem--title');
    title.text(SETTINGS_TOOL_LABEL)

    var iconSpan = $(link).find('.Mrphs-toolsNav__menuitem--icon');
    iconSpan.removeClass('icon-sakai-siteinfo').addClass('icon-sakai-joinable-groups');
};


var markAsHidden = function (elt) {
    $(elt).addClass("is-invisible");
};


$(document).ready(function() {
    var settingsTool = findSettingsMenuLink();

    if (!settingsTool) {
        return;
    }

    if (showSiteInfoAsSettings) {
        markAsHidden(settingsTool);
        return;
    }

    if (showJoinableGroups) {
        switchToJoinableGroups(settingsTool);

        var tool = $('.tool-sakai-siteinfo');
        if (tool.length > 0) {
            tool.find('.portletTitle .title h2').text(SETTINGS_TOOL_LABEL);
        }
    } else {
        $(settingsTool).closest('li').hide();
    }
});
