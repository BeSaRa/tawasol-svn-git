module.exports = function (app) {
    require('./barcode-settings-style.scss');
    app.directive('barcodeSettingsDirective', function () {
        'ngInject';
        return {
            template: require('./barcode-settings-template.html'),
            controller: 'barcodeSettingsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                barcodeOptions: '='
            },
            link: function (scope, element, attrs) {

            }
        }
    })
};