(function (app) {
    app.directive('sortableDirective', function (menuService) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, ele) {
                $(ele)
                    .sortable({
                        handle: '.handler',
                        update: function (event, ui) {
                            var children = [];
                            var parent = ui.item.parent().attr('id').split('-').pop();
                            parent = parent.length ? Number(parent) : 0;
                            ui.item.parent().children().each(function (item) {
                                var id = this.id.split('-').pop();
                                var menu = menuService.getMenuItemByID(id);
                                menu.sort_order = (item + 1 );
                                children.push(menu);
                            });
                            menuService.updateMenus(children);

                        }
                    })
                    .disableSelection();
            }
        }
    })
})(app);