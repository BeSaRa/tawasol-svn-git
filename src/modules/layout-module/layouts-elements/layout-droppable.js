module.exports = function (app) {
    app.directive('layoutDroppable', function (layoutService, layoutBuilderService) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {

                function _receiver(receiver, sender, ele) {
                    // if row and column
                    if (receiver === 'row' && sender === 'column') {
                        var currentSize = _.reduce(element.children('.layout-element'), function (sum, e) {
                            var widget = $(e).data('relation').widget;
                            return sum + widget.flexSize;
                        }, 0);
                        var flexSize = ele.data('layoutElement').flexSize;
                        return (flexSize + currentSize) <= 100;
                    }
                    // if root element and row
                    if (receiver === 'root' && sender === 'row') {
                        return true;
                    }

                    if (receiver === 'column' && sender === 'widget') {
                        return !element.children('.widget').length;
                    }

                    if (receiver === 'column' && sender === 'row') {
                        return !element.children('.widget').length;
                    }
                }

                $(element)
                    .droppable({
                        greedy: true,
                        accept: function (ui) {
                            if (ui.data('relation'))
                                return false;

                            if (element.hasClass('row') && ui.hasClass('column')) {
                                return _receiver('row', 'column', ui);
                            } else if (element.hasClass('column') && ui.hasClass('widget')) {
                                return _receiver('column', 'widget', ui);
                            } else if (element.hasClass('column') && ui.hasClass('row')) {
                                return _receiver('column', 'row', ui);
                            } else if (element.hasClass('layout-root-builder') && ui.hasClass('row')) {
                                return _receiver('root', 'row', ui);
                            }
                            return false;
                        },
                        drop: function (event, ui) {
                            var widget = ui.draggable.data('layoutElement');
                            var layoutWidget = $(element).data('relation') || {layoutId: layoutBuilderService.currentLayout.id};
                            var itemOrder = $(element).children('.layout-element').length;

                            layoutService
                                .prepareLayoutWidget(widget, layoutWidget, itemOrder)
                                .addLayoutWidget(element)
                                .then(function (layoutWidget) {
                                    layoutBuilderService.drawElement(layoutWidget, element);
                                });
                        }
                    });

            }
        }
    })
};