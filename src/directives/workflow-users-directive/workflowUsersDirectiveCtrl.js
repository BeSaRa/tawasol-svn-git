module.exports = function (app) {
    app.controller('workflowUsersDirectiveCtrl', function ($scope,
                                                           langService,
                                                           DistributionWFItem,
                                                           rootEntity,
                                                           LangWatcher,
                                                           $filter,
                                                           _) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowUsersDirectiveCtrl';
        LangWatcher($scope);

        self.globalSettings = rootEntity.getGlobalSettings();

        self.selectedWorkflowItems = [];

        self.defaultWorkflowItemsSettings = new DistributionWFItem();
        /**
         * @description get translated key name to use it in orderBy.
         * @returns {string}
         */
        self.getTranslatedKey = function () {
            return langService.current === 'ar' ? 'arName' : 'enName';
        };
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

        self.runSetDefaultWorkflowItemsSettings = function (selected, gridName, $event, currentGridName) {
            return self.callbackSetDefaultWorkflowItemsSettings(selected, gridName, $event, currentGridName);
        };

        self.runAddSelectedUsersToGrid = function (items, $event) {
            return self.callbackAddSelectedUsersToGrid(items, $event);
        };

        self.runAddSelectedUsersWithIgnoreToGrid = function (items, $event) {
            return self.callbackAddSelectedUsersWithIgnoreToGrid(items, $event);
        };

        self.runSetSettingsToDistWorkflowItem = function (item, $event, currentGridName) {
            return self.callbackSetSettingsToDistWorkflowItem(item, $event, currentGridName, self.organizationGroups);
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

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.gridItems = $filter('orderBy')(self.gridItems, self.grid[self.gridName].order);
        };

        self.isAnyOutOfOffice = function () {
            return _.some(self.gridItems, function (item) {
                return item.isUserOutOfOffice();
            })
        };

        self.getColspan = function () {
            var colspan = 4;
            if (!self.isAnyOutOfOffice()){
                colspan--;
            }
            return colspan;
        }

    });
};
