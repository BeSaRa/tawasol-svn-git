module.exports = function (app) {
    app.controller('localizationCtrl', function (lookupService, _, toast, $rootScope, dialog, langService, cmsTemplate, $q, $filter, gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'localizationCtrl';
        // current localizations
        self.localizations = [];
        // all localization Modules
        self.localizationModules = lookupService.returnLookups(lookupService.localizationModule);
        // the current selected localization module
        self.selectedLocalizationModule = null;
        // progress bar for grid
        self.progress = null;
        // all selected localization
        self.selectedLocalizations = [];
        // search model to search inside the grid
        //self.searchModel = '';


        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.localization) || 20, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.localization),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.localization, limit);
            }
        };

        function _openSelectLocalizationModule($event) {
            self.selectedLocalization = [];
            dialog
                .showDialog({
                    template: cmsTemplate.getPopup('localization-module-selector'),
                    targetEvent: $event,
                    controller: function (dialog) {
                        'ngInject';
                        var ctrl = this;
                        ctrl.localizationModules = self.localizationModules;
                        ctrl.selectedLocalizationModule = null;
                        ctrl.selectLocalizationModule = function () {
                            dialog.hide(ctrl.selectedLocalizationModule);
                        }
                    },
                    controllerAs: 'ctrl'
                })
                .then(function (selectedModule) {
                    if (!selectedModule)
                        return;
                    self.selectedLocalizationModule = selectedModule;

                    self.reloadLocalizationModule();
                })
        }

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.localizations = $filter('orderBy')(self.localizations, self.grid.order);
        };

        // to start open the localization module when controller loaded.
        _openSelectLocalizationModule(null);
        /**
         * @description reload current localization Module.
         */
        self.reloadLocalizationModule = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            self.selectedLocalizations = [];
            if (!pageNumber)
                pageNumber = self.grid.page;

            langService
                .loadLocalizationByModule(self.selectedLocalizationModule)
                .then(function (result) {
                    self.localizations = result;
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                });
        };
        /**
         * @description open localization Module Selector.
         */
        self.openLocalizationModuleSelector = function ($event) {
            return _openSelectLocalizationModule($event);
        };
        /**
         * @description delete localization
         * @param localization
         * @param $event
         * @return {*}
         */
        self.removeModifiedLocalization = function (localization, $event) {
            return langService
                .controllerMethod
                .deleteLocalization(localization, $event)
                .then(function () {
                    self.reloadLocalizationModule(self.grid.page);
                });
        };
        /**
         * @description edit localization
         * @param localization
         * @param $event
         */
        self.modifyLocalization = function (localization, $event) {
            return langService
                .controllerMethod
                .editLocalization(localization, $event)
                .then(function (local) {
                    toast.success(langService.get('edit_success').change({name: local.getLocalizationKey()}));
                    // TODO: LOAD LOCALIZATION BY MODULE TILL THE BACKEND TEAM CHANGE IT.
                    langService
                        .loadLocalizationKeys()
                        .then(function (localizations) {
                            self.localizations = _.filter(localizations, function (item) {
                                return item.module === self.selectedLocalizationModule.lookupKey;
                            });
                            $rootScope.lang = langService.getCurrentTranslate();
                        });
                });
        }


    });
};