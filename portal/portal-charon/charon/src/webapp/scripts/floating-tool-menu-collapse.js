/* Handle floating "collapse tool menu" button */
(function (exports, $) {

    function ElementFloater(targetElement) {
        var self = this;

        this.targetElement = targetElement;
        this.floatingElement = undefined;
        this.previousVisibility = undefined;

        $(window).on('DOMContentLoaded load resize scroll', function () {
            self._handleVisibilityChange();
        });

        this._handleVisibilityChange();
    }

    ElementFloater.prototype._handleVisibilityChange = function () {
        var visible = isElementInViewport(this.targetElement);

        if (visible !== this.previousVisibility) {
            this.previousVisibility = visible;

            if (visible) {
                this._dockElement();
            } else {
                this._floatElement();
            }
        }
    };

    ElementFloater.prototype._dockElement = function () {
        if (this.floatingElement) {
            $(this.floatingElement).remove();
            this.floatingElement = undefined;
        }
    };

    ElementFloater.prototype._floatElement = function () {
        /* Start by removing any previous floating element so we never end up with two :) */
        this._dockElement();

        this.floatingElement = $('<div class="floatingToolMenu" />');
        this.floatingElement.css({
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: $(this.targetElement).outerWidth(),
        });

        var list = $('<ul>').append($(this.targetElement).clone(true));
        this.floatingElement.append(list);

        var self = this;
        this.floatingElement.on('click', function () {
            self.previousVisibility = undefined;
            self._handleVisibilityChange();
        });

        $('body').append(this.floatingElement);
    };

    function isElementInViewport(el) {
        var rect = el.getBoundingClientRect();

        return (rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth));
    }

    exports.ElementFloater = ElementFloater;
}(window, jQuery));


jQuery(function () {
    var collapse = $('.Mrphs-collapseTools');
    if (collapse.length > 0) {
        new ElementFloater(collapse[0]);
    }
});
