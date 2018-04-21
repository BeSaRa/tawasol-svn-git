module.exports = function (app) {
    app.controller('filterPopCtrl', function (filter,
                                              dialog,
                                              actions,
                                              senders,
                                              $scope,
                                              langService,
                                              LangWatcher,
                                              lookupService,
                                              editMode) {
        'ngInject';
        var self = this;
        self.controllerName = 'filterPopCtrl';
        LangWatcher($scope);
        self.editMode = editMode;
        self.model = angular.copy(filter);
        self.filter = angular.copy(filter);
        self.senders = senders;
        self.actions = actions;
        self.documentTypes = lookupService.returnLookups(lookupService.documentClass);
        /**
         * @description save user filter
         * @param $event
         */
        self.saveUserFilterFromCtrl = function ($event) {
            self.filter.saveUserFilter().then(function () {
                dialog.hide(self.filter);
            })
        };

        self.checkDisabled = function (form) {
            var hasCriteria = false;
            for (var key in self.filter.ui) {
                if (typeof self.filter.ui[key].value === 'string')
                    self.filter.ui[key].value = self.filter.ui[key].value.trim();

                if (!!self.filter.ui[key].value) {
                    hasCriteria = true;
                    break;
                }
            }
            return form.$invalid || !hasCriteria;
        };

        self.resetFilterForm = function (form, $event) {
            self.filter = angular.copy(self.model);
            form.$setUntouched();
        };

        self.closeFilterForm = function ($event) {
            dialog.cancel();
        };
    });
};