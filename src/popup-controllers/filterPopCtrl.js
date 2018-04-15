module.exports = function (app) {
    app.controller('filterPopCtrl', function (filter, actions, senders, $scope, langService, LangWatcher, lookupService, editMode) {
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

            });
        };

        self.log = function () {
            console.log(self.filter);
        }

    });
};