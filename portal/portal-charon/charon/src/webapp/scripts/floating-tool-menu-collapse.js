/* Handle floating "collapse tool menu" button */
(function (exports, $) {

    function ElementFloater(element) {
        var self = this;

        this.element = element;
        this.floating_element = undefined;
        this.previous_visibility = undefined;

        $(window).on('DOMContentLoaded load resize scroll', function () {
            self._handle_visibility_change();
        });

        this._handle_visibility_change();
    }

    ElementFloater.prototype._handle_visibility_change = function () {
        var visible = isElementInViewport(this.element);

        if (visible !== this.previous_visibility) {
            this.previous_visibility = visible;

            if (visible) {
                this._dock_element();
            } else {
                this._float_element();
            }
        }
    };

    ElementFloater.prototype._dock_element = function () {
        if (this.floating_element) {
            $(this.floating_element).remove();
            this.floating_element = undefined;
        }
    };

    ElementFloater.prototype._float_element = function () {
        /* Start by removing any previous floating element so we never end up with two :) */
        this._dock_element();

        this.floating_element = $('<div class="floatingToolMenu" />');
        this.floating_element.css({
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: $(this.element).outerWidth(),
        });

        var list = $('<ul>').append($(this.element).clone(true));
        this.floating_element.append(list);

        var self = this;
        this.floating_element.on('click', function () {
            self.previous_visibility = undefined;
            self._handle_visibility_change();
        });

        $('body').append(this.floating_element);
    };

    function isElementInViewport(el) {
        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    exports.ElementFloater = ElementFloater;
}(window, jQuery));

jQuery(function () {
    var collapse = $('.Mrphs-collapseTools');
    if (collapse.length > 0) {
        new ElementFloater(collapse[0]);
    }
});
