jQuery(function () {
    var collapse = $('.Mrphs-collapseTools');
    if (collapse.length > 0) {
        var floatIt = function () {
            var width = $('#toolMenuWrap').outerWidth();

            collapse.css('position', 'fixed')
                    .css('bottom', 0)
                    .css('left', 0)
                    .css('width', width);

            collapse.addClass('floatingToolMenu');
        };

        floatIt();

        collapse.on('click', floatIt);

        $(window).on('resize', floatIt);
    }
});
