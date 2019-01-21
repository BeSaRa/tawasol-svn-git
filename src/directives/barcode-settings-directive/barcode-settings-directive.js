module.exports = function (app) {
    require('./barcode-settings-style.scss');
    app.directive('barcodeSettingsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            templateUrl: cmsTemplate.getDirective('barcode-settings-template.html'),
            controller: 'barcodeSettingsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                globalSetting: '='
            }
        }
    })
};
