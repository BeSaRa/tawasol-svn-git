module.exports = function (app) {
    app.controller('workflowUsersDirectiveCtrl', function ($scope,
                                                           langService,
                                                           DistributionWFItem,
                                                           rootEntity,
                                                           LangWatcher,
                                                           generator,
                                                           $filter,
                                                           _) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowUsersDirectiveCtrl';
        LangWatcher($scope);

        self.globalSettings = rootEntity.getGlobalSettings();

        self.selectedWorkflowItems = [];
        self.sendRelatedDocsBulk = false;

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
            if (!self.isAnyOutOfOffice()) {
                colspan--;
            }
            return colspan;
        }

        var getAvailableGridItems = function () {
            if (!self.gridItems) {
                return [];
            }
            if (!self.excludeSelected) {
                return self.gridItems.filter(x => true);
            } else {
                return self.gridItems.filter(function (item) {
                    return self.runUserNotExists(item);
                })
            }
        }

        self.isCheckedSendRelatedDocs = function () {
            var allItems = getAvailableGridItems();
            return !!(allItems.length && _getWorkflowItemsWithSendRelatedDocs().length === allItems.length);
        };

        self.isIndeterminateSendRelatedDocs = function () {
            var allItems = getAvailableGridItems();
            return !!(_getWorkflowItemsWithSendRelatedDocs().length && _getWorkflowItemsWithSendRelatedDocs().length < allItems.length);
        };

        var _getWorkflowItemsWithSendRelatedDocs = function () {
            var allItems = getAvailableGridItems();
            return _.filter(allItems, function (workflowItem) {
                return !!workflowItem.sendRelatedDocs;
            });
        };

        var _toggleAllSendRelatedDocs = function (value) {
            self.gridItems = _.map(self.gridItems, function (workflowItem) {
                if (self.excludeSelected) {
                    if (self.runUserNotExists(workflowItem)) {
                        // ignore sending related docs to user with different departments
                        workflowItem.sendRelatedDocs = (self.globalSettings.canSendRelatedDocsToSameDepartmentOnly() && !workflowItem.isSendRelatedDocsAllowed()) ? false : value;
                    }
                } else {
                    // ignore sending related docs to user with different departments
                    workflowItem.sendRelatedDocs = (self.globalSettings.canSendRelatedDocsToSameDepartmentOnly() && !workflowItem.isSendRelatedDocsAllowed()) ? false : value;
                }
                return workflowItem;
            });
        };

        /**
         * @description Toggle the sendRelatedDocs checkbox for all added items
         * @param $event
         */
        self.toggleBulkSendRelatedDocs = function ($event) {
            var allItems = getAvailableGridItems();
            if (self.sendRelatedDocsBulk) {
                if (_getWorkflowItemsWithSendRelatedDocs().length === allItems.length) {
                    _toggleAllSendRelatedDocs(false);
                } else {
                    _toggleAllSendRelatedDocs(true);
                }
            } else {
                _toggleAllSendRelatedDocs(true);
            }
        };

    });
};
