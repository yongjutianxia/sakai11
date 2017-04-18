function GradebookHelpPopup() {
    this.siteid = $("#gradebookGradesTable").data('siteid');
    this.checkIfShouldShowPopup();
}


GradebookHelpPopup.prototype.isHelpLinkPresent = function() {
    return this.getHelpLink().length > 0;
};


GradebookHelpPopup.prototype.getHelpLink = function() {
    return $('.Mrphs-toolTitleNav__link.Mrphs-toolTitleNav__link--help-popup');
};


GradebookHelpPopup.prototype.checkIfShouldShowPopup = function() {
    var self = this;

    if (!self.isHelpLinkPresent()) {
        // no help link!
        return;
    }

    if (self.isSoftlyDismissed()) {
        // cookie says we're dismissed for this session!
        return;
    }

    $.ajax('/direct/gbng/show-help-popup', {
        method: 'GET',
        data: {
            siteId: self.siteid
        },
        cache: false,
        success: function(result) {
            if (result == 'true') {
                self.showPopup();
            } else {
                // ensure the popup checks only won't happen again until the session expires 
                document.cookie = "gradebookng-help-popup=dismissed; path=/"
            }
        }
    });
};


GradebookHelpPopup.prototype.showPopup = function() {
    var self = this;

    var $mask = $('<div>').attr('id', 'gradebookHelpMask');

    var $popup = $('<div>').attr('id', 'gradebookHelpPopup');
    $popup.append('<a href="javascript:void()" class="gradebookHelpSoftDismiss" aria-label="Close this popup"><i class="fa fa-times" aria-hidden="true"></i></a>');
    $popup.append('<h3>Welcome to the new Gradebook</h3>');
    $popup.append('<p>Spreadsheet-style grade entry, student grade summary views, improved usability and more.</p>');
    $popup.append('<p>Click the <strong>Help for this tool</strong> button above to learn more.</p>');

    $popup.attr('role', 'dialog');

    var $actions = $('<div>').addClass('help-popup-actions');
    $actions.append($('<button class="button">Remind me later</button>').addClass('gradebookHelpSoftDismiss'));
    $actions.append($('<button class="button_color">Ok, got it</button>').addClass('gradebookHelpHardDismiss'));

    $popup.append($actions);

    $(".Mrphs-sakai-gradebookng").prepend($popup);
    $(document.body).prepend($mask);

    $popup.on('click', '.gradebookHelpHardDismiss', function(event) {
        $popup.remove();
        $mask.remove();
        self.hardDismissPopup();
    }).on('click', '.gradebookHelpSoftDismiss', function(event) {
        $popup.remove();
        $mask.remove();
        self.softlyDismissPopup();
    });

    $mask.on('click', function() {
        $popup.remove();
        $mask.remove();
        self.softlyDismissPopup();
    });
};


GradebookHelpPopup.prototype.hardDismissPopup = function() {
    var self = this;

    // hide forevermore
    $.ajax('/direct/gbng/dismiss-help-popup', {
        method: 'POST',
        data: {
            siteId: self.siteid
        }
    });

    // ensure the popup checks only won't happen again until the session expires 
    document.cookie = "gradebookng-help-popup=dismissed; path=/"
};


GradebookHelpPopup.prototype.softlyDismissPopup = function() {
    var timeToBeDismissed = 60*60*24; // hide for the 24 hours
    document.cookie = "gradebookng-help-popup=dismissed; path=/; max-age=" + timeToBeDismissed;
};


GradebookHelpPopup.prototype.isSoftlyDismissed = function() {
    var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)gradebookng-help-popup\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    return cookieValue == 'dismissed';
};


$(document).ready(function() {
    sakai.gradebookng.popup = new GradebookHelpPopup();
});