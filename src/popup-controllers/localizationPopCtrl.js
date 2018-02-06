module.exports = function (app) {
    app.controller('localizationPopCtrl', function (localization, toast, langService, lookupService, generator, newLocalizationKey, dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'localizationPopCtrl';
        // the default localization model
        self.model = angular.copy(localization);
        // localization
        self.localization = angular.copy(localization);
        // to check if it to create lang Key
        self.newLocalizationKey = newLocalizationKey;

        self.localizationModules = lookupService.returnLookups(lookupService.localizationModule);

        /**
         * @description save the localization
         */
        self.saveLocalization = function () {
            if (self.newLocalizationKey) {
                return self.localization
                    .addGlobalLocalization()
                    .then(function (local) {
                        toast.success(langService.get('add_success').change({name: local.getLocalizationKey()}));
                        self.model = angular.copy(local);
                        self.localization = angular.copy(self.model);
                        dialog.hide(self.model);
                    })
                    .catch(function () {
                        toast.error(langService.get('internal_server_error'));
                    });

            }

            self.localization
                .saveLocalizationKey()
                .then(function (local) {
                    self.model = angular.copy(local);
                    self.localization = angular.copy(self.model);
                    dialog.hide(self.model);
                })
        };
        /**
         * @description close the dialog
         */
        self.closeLocalizationPopup = function () {
            dialog.cancel();
        };
        /**
         * @description reset model.
         */
        self.resetModel = function () {
            generator.resetFields(self.localization, self.model);
        };


    });
};