module.exports = function (app) {
    app.controller('selectedWorkflowItemsDirectiveCtrl', function ($scope, _, rootEntity, dialog, cmsTemplate, langService, DistributionWFItem, LangWatcher,$filter) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectedWorkflowItemsDirectiveCtrl';
        LangWatcher($scope);
        self.globalSettings = rootEntity.getGlobalSettings();
        // workflowItems users , organizations , workflowGroups
        self.workflowItems = [];
        // selected workflow items
        self.selectedWorkflowItems = [];

        self.defaultWorkflowItemsSettings = new DistributionWFItem();

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.workflowItems.length + 21);
                    }
                }
            ]
        };

        /**
         * @description to check all items has actions
         * @param items
         * @returns {boolean}
         * @private
         */
        function _allActionsSelected(items) {
            return !_.some(items, function (item) {
                return !item.isWFComplete();
            });
        }

        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setDueDate(result.dueDate)
                .setComments(result.comments)
                .setAction(result.action)
                .setSendEmail(result.sendEmail)
                .setSendSMS(result.sendSMS);
        }

        /**
         * @description just for apply notifications settings
         * @param distWorkflowItem
         * @param result
         * @private
         */
        function _applyNotificationSettings(distWorkflowItem, result) {
            distWorkflowItem
                .setSendSMS(result.sendSMS)
                .setSendEmail(result.sendEmail);
        }

        /**
         * @description get translated key name to use it in orderBy.
         * @returns {string}
         */
        self.getTranslatedKey = function () {
            return langService.current === 'ar' ? 'arName' : 'enName';
        };
        /**
         * check all items complete
         * @returns {number|*}
         */
        self.checkAllComplete = function () {
            return self.workflowItems.length && _allActionsSelected(self.workflowItems);
        };
        /**
         * delete workflowItem
         * @param workflowItem
         * @param $event
         */
        self.deleteWorkflowItem = function (workflowItem, $event) {
            self.workflowItems = _.filter(self.workflowItems, function (item) {
                return !workflowItem.isSameWorkflowItem(item)
            });
        };
        /**
         * @description delete bulk selected
         * @param $event
         */
        self.deleteSelectedBulk = function ($event) {
            _.map(self.selectedWorkflowItems, function (item) {
                self.deleteWorkflowItem(item);
            });
            // make selected again empty array.
            self.selectedWorkflowItems = [];
        };
        self.workflowItemSettingDialog = function (dialogTitle, distWorkflowItem, $event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('workflow-item-settings'),
                controller: 'workflowItemSettingPopCtrl',
                controllerAs: 'ctrl',
                targetEvent: $event,
                locals: {
                    comments: self.workflowComments,
                    workflowActions: self.workflowActions,
                    dialogTitle: dialogTitle,
                    distWorkflowItem: distWorkflowItem
                }
            })
        };
        self.setBulkWorkflowItemSettings = function ($event) {
            return self
                .workflowItemSettingDialog(langService.get('set_default_workflow_attributes'), self.defaultWorkflowItemsSettings, $event)
                .then(function (result) {
                    _setDistWorkflowItem(self.defaultWorkflowItemsSettings, result);
                    _.map(self.workflowItems, function (item, index) {
                        _setDistWorkflowItem(self.workflowItems[index], result);
                    });
                });
        };

        self.applyNotificationSettings = function ($event) {
            _.map(self.workflowItems, function (item, index) {
                _applyNotificationSettings(self.workflowItems[index], self.defaultWorkflowItemsSettings);
            });
        };


        self.setWorkflowItemSettings = function (workflowItem, $event) {
            return self
                .workflowItemSettingDialog((langService.get('workflow_properties') + ' ' + workflowItem.getTranslatedName()), workflowItem, $event)
                .then(function (result) {
                    _setDistWorkflowItem(workflowItem, result);
                });
        };

        // /**
        //  * @description Sets the workflow action
        //  * @param workflowItem
        //  * @param $event
        //  */
        // self.setWFAction = function (workflowItem, $event) {
        //     workflowItem.setAction(workflowItem.selectedWFAction);
        // };

        /**
         * @description Sets the workflow comment
         * @param workflowItem
         * @param $event
         */
        self.setWFComment = function (workflowItem, $event) {
            workflowItem.setComments(workflowItem.selectedWFComment);
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            var code = $event.which || $event.keyCode;
            if (code !== 38 && code !== 40)
                $event.stopPropagation();
        };


        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.workflowItems = $filter('orderBy')(self.workflowItems, self.grid.order);
        };


    });
};
