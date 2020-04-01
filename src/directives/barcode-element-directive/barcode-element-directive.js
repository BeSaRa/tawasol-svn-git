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
                        cancel: '.sort-cancel',
                        receive: function (e, ui) {
                            var idx = element.data('rowIndex');
                            var item = ui.helper.data('item');

                            if (element.hasClass('barcode-row')) {
                                ui.helper.replaceWith(self.compileItem(self.createItem(item, idx), item));
                                ui.helper.data('item', item);
                                scope.$apply(function () {
                                    self.updateRows(ui.helper);
                                });
                            }
                        },
                        update: function () {
                            self.updateIsElectronicStatus();
                            self.updateRows();
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
                            if (scope.item) {
                                ui.helper.prepend($compile(self.createDeleteButton('item'))(scope));
                                ui.helper.data('item', item);
                            }
                        }
                    });
            }
        }
    });
};
