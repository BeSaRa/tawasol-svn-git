module.exports = function (app) {
    app.directive('localizationModuleConverterDirective', function (cmsTemplate) {
        'ngInject';
        return {
            templateUrl: cmsTemplate.getDirective('localization-module-converter-template.html'),
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
