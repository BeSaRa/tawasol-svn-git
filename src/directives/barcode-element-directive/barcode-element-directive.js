module.exports = function (app) {
    app.directive('barcodeElementDirective', function ($rootScope, $compile) {
        'ngInject';
        var closeButtonTemplate = '<div class="barcode-delete-item-button">\n' +
            '                            <md-button ng-click="ctrl.deleteItem($event)" class="md-icon-button">\n' +
            '                                <md-icon md-svg-icon="close"></md-icon>\n' +
            '                            </md-button>\n' +
            '                        </div>';
        return {
            restrict: 'A',
            require: '^barcodeSettingsDirective',
            scope: {
                item: '=barcodeElementDirective'
            },
            link: function (scope, element, attrs, ctrl) {
                $(element).draggable({
                    connectToSortable: ".barcode-row",
                    helper: "clone",
                    revert: "invalid",
                    start: function (event, ui) {
                        ui.helper.data('barcodeElement', scope.item);
                        ui.helper.removeClass('flex');
                        var $scope = $rootScope.$new(true);
                        $scope.ctrl = ctrl;
                        ui.helper.prepend($compile(angular.element(closeButtonTemplate))($scope));
                    }
                });
            }
        }
    });


    app.directive('barcodeSortableDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {
                $(element)
                    .sortable()
                    .disableSelection();
            }
        }
    });


    app.directive('barcodeRowDirective', function ($compile, $rootScope) {
        'ngInject';
        return {
            restrict: 'A',
            require: '^barcodeSettingsDirective',
            scope: {
                row: '=barcodeRowDirective'
            },
            link: function (scope, element, attrs, ctrl) {
                element.data('row', scope.row);

                $(element)
                    .sortable({
                        update: function (event, ui) {

                        }
                    })
                    .disableSelection();

                $(element)
                    .droppable({
                        accept: '.barcode-item',
                        drop: function (event, ui) {
                            var lookup = ui.helper.data('barcodeElement');
                            ui.helper
                                .removeClass('flex');
                            ui.helper
                                .removeAttr('style')
                                .removeAttr('flex');
                        }
                    });
            }
        }
    })
};