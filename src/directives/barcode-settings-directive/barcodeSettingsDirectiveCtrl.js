module.exports = function (app) {
    app.controller('barcodeSettingsDirectiveCtrl', function ($scope, $element, lookupService) {
        'ngInject';
        var self = this;
        self.controllerName = 'barcodeSettingsDirectiveCtrl';

        self.barcodeElements = lookupService.returnLookups(lookupService.barcodeElement);


        self.rows = [
            [self.barcodeElements[0], self.barcodeElements[1], self.barcodeElements[2]],
            [self.barcodeElements[1]],
            [self.barcodeElements[2]]
        ];

        self.updateRows = function () {
            console.log($element);
        };

        self.deleteRow = function ($event) {
            var $row = angular.element($event.target).parents('.barcode-row'), row = $row.data('row');
            $row.remove();
            self.rows.indexOf(row);
        };

        self.deleteItem = function ($event) {
            var $item = angular.element($event.target).parents('.barcode-item'), item = $item.data('barcodeElement');
        }

    });
};