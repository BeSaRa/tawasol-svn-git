module.exports = function (app) {
    app.controller('ministerAssistantsPopCtrl', function (_,
                                                          toast,
                                                          generator,
                                                          ministerAssistants,
                                                          langService,
                                                          gridService,
                                                          correspondence,
                                                          DistributionWFItem,
                                                          DistributionWF,
                                                          distributionWFService,
                                                          actionKey,
                                                          rootEntity,
                                                          DistributionUserWFItem,
                                                          dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'ministerAssistantsPopCtrl';


        self.correspondence = correspondence;
        self.ministerAssistants = _mapWFUser(ministerAssistants);
        self.ministerAssistantsCopy = angular.copy(ministerAssistants);
        self.selectedMinisterAssistants = [];
        self.distWorkflowItem = new DistributionWFItem();
        self.distributionWF = new DistributionWF();
        self.actionKey = actionKey;
        self.defaultMinisterAssistantAction = rootEntity.getGlobalSettings().getDefaultMinisterAssistantAction();


        /**
         * @description launch Minister Assistants WorkFlow
         */
        self.launchMinisterAssistantsWorkFlow = function () {
            if (!self.defaultMinisterAssistantAction) {
                toast.error(langService.get('no_minister_action_selected'));
                return false;
            }

            self.setBulkDistWorkflowItems();
            self.distributionWF.setNormalUsers(_.filter(self.selectedMinisterAssistants, _filterWFUsers));

            distributionWFService.startLaunchWorkflow(self.distributionWF, self.correspondence, self.actionKey)
                .then(function (result) {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    dialog.hide();
                }).catch(function (error) {
            });
        }

        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setAction(self.defaultMinisterAssistantAction)
        }

        self.setBulkDistWorkflowItems = function () {
            _.map(self.selectedMinisterAssistants, function (item, index) {
                _setDistWorkflowItem(self.selectedMinisterAssistants[index], self.distWorkflowItem);
            });
        }

        function _filterWFUsers(item) {
            return item.isUser();
        }

        /**
         * @description map the WFUser to be dist user.
         * @param collection
         * @param gridName
         * @returns {Array}
         * @private
         */
        function _mapWFUser(collection, gridName) {
            return _.map(collection, function (workflowUser) {
                return (new DistributionUserWFItem()).mapFromWFUser(workflowUser).setGridName(gridName || null);
            });
        }

        self.grid = {
            name: '',
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ministerAssistants.length + 21);
                    }
                }
            ],
            searchColumns: {
                name: function (record) {
                    return record.getTranslatedKey();
                },
                ou: function (record) {
                    return langService.current + 'OUName';
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.ministerAssistants = gridService.searchGridData(self.grid.ministerAssistants, self.ministerAssistantsCopy);
            }
        };

        /**
         * @description get translated key name to use it in orderBy.
         * @returns {string}
         */
        self.getTranslatedKey = function () {
            return langService.current === 'ar' ? 'arName' : 'enName';
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.ministerAssistants = $filter('orderBy')(self.ministerAssistants, self.grid.order);
        };

        self.getSortingKey = function (property, modelType) {
            if (property === 'organization') {
                return 'ou' + (langService.currentLangTitleCase) + 'Name';
            }
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Close the popup
         */
        self.closeDialog = function () {
            dialog.cancel();
        };
    });
};
