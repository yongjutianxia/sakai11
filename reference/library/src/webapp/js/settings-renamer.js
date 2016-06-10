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
    var result = undefined;

    $('.Mrphs-toolsNav__menuitem--link').each (function (idx, link) {
        var title = $(link).find('.Mrphs-toolsNav__menuitem--title');
        if (title.text() === OLD_TOOL_LABEL) {
            result = link;
        }
    });

    return result;
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

    if (showSiteInfoAsSettings) {
        markAsHidden(settingsTool);

        return;
    }

    if (!settingsTool) {
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
