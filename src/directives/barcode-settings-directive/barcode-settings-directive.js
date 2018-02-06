module.exports = function (app) {
    app.directive('barcodeSettingsDirective', function () {
        'ngInject';
        return {
            template: require('./barcode-settings-template.html'),
            controller: 'barcodeSettingsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                barcodeOptions: '='
            },
            link: function (scope, element, attrs) {

            }
        }
    })
};