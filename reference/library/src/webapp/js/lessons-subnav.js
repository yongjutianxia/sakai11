(function() {
    function LessonsSubPageNavigation(data, currentPageId) {
        this.data = data;
        this.currentPageId = currentPageId;
        this.setup();
    };

    LessonsSubPageNavigation.prototype.setup = function() {
        var self = this;

        for (var page_id in self.data) {
            if (self.data.hasOwnProperty(page_id)) {
                var sub_pages = self.data[page_id];
                self.render_subnav_for_page(page_id, sub_pages);
            }
        }
    };

    LessonsSubPageNavigation.prototype.render_subnav_for_page = function(page_id, sub_pages) {
        var self = this;

        var $menu = document.querySelector('#toolMenu a[href$="/tool/'+page_id+'"], #toolMenu [href$="/tool-reset/'+page_id+'"]');
        var $li = $menu.parentElement;

        var $submenu = document.createElement('ul');
        $submenu.classList.add('lessons-sub-page-menu');

        sub_pages.forEach(function(sub_page) {
            var $submenu_item = document.createElement('li');
            var $submenu_action = document.createElement('a');

            $submenu_action.href = self.build_sub_page_url_for(sub_page);
            $submenu_action.innerText = sub_page.name;
            $submenu_item.appendChild($submenu_action);

            $submenu.appendChild($submenu_item);

            if (sub_page.sendingPage === self.currentPageId) {
                $li.classList.add('is-parent-of-current');
                $submenu_item.classList.add('is-current');
            }
        });

        self.setup_parent_menu($li, $menu);
        $li.appendChild($submenu);
    };


    LessonsSubPageNavigation.prototype.setup_parent_menu = function($li, $menu) {
        $li.classList.add('has-lessons-sub-pages');
        var $goto = document.createElement('a');
        $goto.href = $menu.href;
        $goto.classList.add('lessons-goto-top-page');
        $menu.href = 'javascript:void(0);';

        $menu.addEventListener('click', function(event) {
            event.preventDefault();
            if ($li.classList.contains('expanded')) {
                $li.classList.remove('expanded');
            } else {
                var $ul = $li.parentElement;
                $li.querySelectorAll('li.expanded').forEach(function(el) {
                    el.classList.remove('expanded');
                });
                $li.classList.add('expanded');
            }
        });

        if ($li.classList.contains('is-current')) {
            $li.classList.add('expanded');
        }

        $li.appendChild($goto);
    };


    LessonsSubPageNavigation.prototype.build_sub_page_url_for = function(sub_page) {
        var url = '/portal/site/' + sub_page.siteId;
        url += '/tool/' + sub_page.toolId;
        url += '/ShowPage?sendingPage='+sub_page.sendingPage;
        url += '&itemId='+sub_page.itemId;
        url += '&path=clear_and_push';
        url += '&title=' + sub_page.name;
        url += '&newTopLevel=false';
        return url;
    };

    window.LessonsSubPageNavigation = LessonsSubPageNavigation;
})();
