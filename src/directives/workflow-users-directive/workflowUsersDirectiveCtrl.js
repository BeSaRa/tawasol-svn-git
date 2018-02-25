module.exports = function (app) {
    app.controller('workflowUsersDirectiveCtrl', function ($scope, DistributionWFItem, $timeout, LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowUsersDirectiveCtrl';
        LangWatcher($scope);

        self.selectedWorkflowItems = [];

        self.defaultWorkflowItemsSettings = new DistributionWFItem();

        /**
         * @description run toggle bulk favorites.
         * @param selected
         * @param type
         */
        self.runToggleBulkFavorites = function (selected, type) {
            self.callbackToggleBulkFavorites(selected, type);
        };

        self.runAllInFavorites = function (items) {
            return self.callbackAllInFavorites(items);
        };

        self.runToggleFav = function (item) {
            return self.callbackToggleFav(item);
        };

        self.runOpenWorkflowUserOutOfOffice = function (item, $event) {
            return self.callbackOpenWorkflowUserOutOfOffice(item, $event);
        };

        self.runSetDefaultWorkflowItemsSettings = function (selected, gridName, $event) {
            return self.callbackSetDefaultWorkflowItemsSettings(selected, gridName, $event);
        };

        self.runAddSelectedUsersToGrid = function (items, $event) {
            return self.callbackAddSelectedUsersToGrid(items, $event);
        };

        self.runAddSelectedUsersWithIgnoreToGrid = function (items, $event) {
            return self.callbackAddSelectedUsersWithIgnoreToGrid(items, $event);
        };

        self.runSetSettingsToDistWorkflowItem = function (item, $event) {
            return self.callbackSetSettingsToDistWorkflowItem(item, $event);
        };

        self.runUserNotExists = function (item) {
            return self.callbackUserNotExists(item);
        };

        self.runAddSelectedUserToGrid = function (item, $event) {
            return self.callbackAddSelectedUserToGrid(item, $event)
        };

        self.runAddSelectedUserWithIgnoreToGrid = function (item, $event) {
            return self.callbackAddSelectedUserWithIgnoreToGrid(item, $event);
        };

        self.runDeleteFromSelected = function (workItem, $event) {
            return self.callbackDeleteFromSelected(workItem, $event);
        };

    });
};