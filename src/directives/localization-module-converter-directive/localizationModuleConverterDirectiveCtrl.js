module.exports = function (app) {
    app.controller('localizationModuleConverterDirectiveCtrl', function (LangWatcher, toast, $scope, langService, lookupService) {
        'ngInject';
        var self = this;
        LangWatcher($scope);
        self.controllerName = 'localizationModuleConverterDirectiveCtrl';

        self.localizationModules = lookupService.returnLookups(lookupService.localizationModule);

        self.localizationModule = null;

        self.moveLocalizationToModule = function () {
            if (!self.localizationModule || !self.localizationKeys.length)
                return;

            return langService
                .changeLocalizationModule(self.localizationModule, self.localizationKeys)
                .then(function () {
                    toast.success(langService.get('localization_module_changed_successfully'));
                    self.localizationKeys = [];
                    if (self.callback)
                        self.callback();
                })
        }

    });
};