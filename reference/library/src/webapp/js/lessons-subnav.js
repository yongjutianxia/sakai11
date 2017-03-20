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

        $li.appendChild($submenu);
        self.setup_parent_menu($li, $menu);
    };


    LessonsSubPageNavigation.prototype.setup_parent_menu = function($li, $menu) {
        $li.classList.add('has-lessons-sub-pages');
        var $goto = document.createElement('span');
        var topLevelPageHref = $menu.href;
        $goto.classList.add('lessons-goto-top-page');
        $menu.href = 'javascript:void(0);';

        $menu.addEventListener('click', function(event) {
            event.preventDefault();

            if (event.target.classList.contains('lessons-goto-top-page')) {
                location.href = topLevelPageHref;
                return false;
            }

            if ($li.classList.contains('expanded')) {
                //Disable collapse - do nuffin
                //$li.classList.remove('expanded');
            } else {
                var $ul = $li.parentElement;
                $li.parentNode.querySelectorAll('li.expanded').forEach(function(el) {
                    el.classList.remove('expanded');
                    el.querySelector('.lessons-sub-page-menu').style.maxHeight = 0 + 'px';
                });
                $li.classList.add('expanded');
                var subpages = $li.querySelectorAll('.lessons-sub-page-menu li').length;
                $li.querySelector('.lessons-sub-page-menu').style.maxHeight = (subpages * 100) + 'px';
            }
        });

        if ($li.classList.contains('is-current')) {
            $li.classList.add('expanded');
            var subpages = $li.querySelectorAll('.lessons-sub-page-menu li').length;
            $li.querySelector('.lessons-sub-page-menu').style.maxHeight = (subpages * 100) + 'px';
        }

        $menu.appendChild($goto);
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
