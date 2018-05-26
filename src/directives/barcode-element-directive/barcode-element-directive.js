module.exports = function (app) {
    app.directive('bcSortable', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var self = scope.ctrl;
                if (element.hasClass('barcode-row')) {
                    element.on('click', function (e) {
                        if (angular.element(e.target).hasClass('barcode-row')) {
                            self.setSelectedRow(element);
                        }
                    })
                }
                $(element)
                    .sortable({
                        tolerance: "pointer",
                        cancel: '.add-row',
                        receive: function (e, ui) {
                            var idx = element.data('rowIndex');
                            if (element.hasClass('barcode-row')) {
                                ui.helper.data('rowIndex', idx);
                                scope.$apply(function () {
                                    self.updateRows(ui.helper);
                                });
                            }
                        },
                        update: function () {
                            //self.updateRows();
                        }
                    })

            }
        }
    });

    app.directive('bcDraggable', function ($compile) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var item = angular.copy(scope.item);
                element.data('item', item);
                var self = scope.ctrl;
                $(element)
                    .draggable({
                        cancel: '.disabled',
                        connectToSortable: '.barcode-row',
                        revert: 'invalid',
                        helper: 'clone',
                        tolerance: "pointer",
                        start: function (e, ui) {
                            ui.helper.prepend($compile(self.createDeleteButton('item'))(scope));
                            if (scope.item) {
                                ui.helper.data('item', item);
                            }
                        }
                    })
                    .disableSelection();
            }
        }
    });
};