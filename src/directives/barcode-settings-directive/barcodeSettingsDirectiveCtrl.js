module.exports = function (app) {
    app.controller('barcodeSettingsDirectiveCtrl', function (lookupService) {
        'ngInject';
        var self = this;
        self.controllerName = 'barcodeSettingsDirectiveCtrl';

        self.barcodeElements = lookupService.returnLookups(lookupService.barcodeElement);

        

    });
};