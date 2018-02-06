module.exports = function (app) {
    app.directive('layoutSortable', function (layoutService) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {

                $(element)
                    .sortable({
                        items: 'div.layout-element',
                        tolerance: 'pointer',
                        placeholder: 'layout-element-placeholder',
                        start: function (event, ui) {
                            var item = ui.item;
                            ui.placeholder.width(item.width()).height(item.height());
                        },
                        update: function (event, ui) {
                            var layoutWidgets = [];
                            ui.item
                                .parent()
                                .children('.layout-element')
                                .each(function (order) {
                                    var item = $(this).data('relation');
                                    item.itemOrder = order;
                                    layoutWidgets.push(item);
                                });

                            layoutService.sortLayoutWidgets(layoutWidgets).then(function (value) {
                                console.log('Sorting Done');
                            });
                        }
                    })
                    .disableSelection();


            }
        }
    })
};