module.exports = function (app) {
    app.directive('localizationModuleConverterDirective', function () {
        'ngInject';
        return {
            template: require('./localization-module-converter-template.html'),
            controller: 'localizationModuleConverterDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                localizationKeys: '=',
                callback: '='
            }
        }
    });
};