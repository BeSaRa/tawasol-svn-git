module.exports = function (app) {
    app.controller('workflowItemsDirectiveCtrl', function ($scope, dialog, cmsTemplate, DistributionWFItem, langService, LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowItemsDirectiveCtrl';
        LangWatcher($scope);

        self.workflowItems = [];

        self.selectedWorkflowItems = [];

        self.selected = [];

        self.defaultWorkflowItemsSettings = new DistributionWFItem();

        /**
         * @description get translated key name to use it in orderBy.
         * @returns {string}
         */
        self.getTranslatedKey = function () {
            return langService.current === 'ar' ? 'arName' : 'enName';
        };

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

        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setDueDate(result.dueDate)
                .setComments(result.comments)
                .setAction(result.action);
        }

        self.runItemNotExists = function (workflowItem) {
            return self.itemNotExistsCallback(workflowItem);
        };

        self.addWorkflowItem = function (workflowItem) {
            self.selected.push(angular.copy(workflowItem));
        };

        self.workflowItemSettingDialog = function (dialogTitle, distWorkflowItem, $event) {
            return dialog.showDialog({
                template: cmsTemplate.getPopup('workflow-item-settings'),
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

        self.setWorkflowItemSettings = function (workflowItem, $event) {
            return self
                .workflowItemSettingDialog((langService.get('workflow_properties') + ' ' + workflowItem.getTranslatedName()), workflowItem, $event)
                .then(function (result) {
                    _setDistWorkflowItem(workflowItem, result);
                });
        };
        /**
         * delete workflowItem
         * @param workflowItem
         * @param $event
         */
        self.deleteWorkflowItem = function (workflowItem, $event) {
            self.selected = _.filter(self.selected, function (item) {
                return !workflowItem.isSameWorkflowItem(item)
            });
        };
        /**
         * check if all selected item in selected workflowItems
         * @param workflowItems
         * @returns {boolean}
         */
        self.allInSelected = function (workflowItems) {
            return !_.some(workflowItems, function (item) {
                return !self.runItemNotExists(item)
            });
        };

        self.addBulkWorkflowItems = function (workflowItems) {
            _.map(workflowItems, function (item) {
                self.addWorkflowItem(item);
            });
        }


    });
};