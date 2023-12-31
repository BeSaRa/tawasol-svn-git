module.exports = function (app) {
    app.controller('workflowGroupCtrl', function (workflowGroups,
                                                  workflowGroupService,
                                                  toast,
                                                  $q,
                                                  $filter,
                                                  langService,
                                                  contextHelpService,
                                                  dialog,
                                                  gridService,
                                                  generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowGroupCtrl';
        contextHelpService.setHelpTo('workflow-group');

        self.workflowGroups = workflowGroups;
        self.workflowGroupsCopy = angular.copy(self.workflowGroups);

        self.selectedWorkflowGroups = [];


        /**
         * @description Get the sorting key for given property
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.workflowGroup) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.workflowGroup, self.workflowGroups),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.workflowGroup, limit);
            },
            searchColumns: {
                arName: 'arName',
                enName: 'enName',
                groupMembers: function (record) {
                    if (record.groupMembers.length === 1) {
                        return self.getSortingKey('groupMembers.0.applicationUser', 'ApplicationUser');
                    }
                    return '';
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.workflowGroups = gridService.searchGridData(self.grid, self.workflowGroupsCopy);
            }
        };

        self.statusServices = {
            'activate': workflowGroupService.activateBulkWorkflowGroups,
            'deactivate': workflowGroupService.deactivateBulkWorkflowGroups,
            'true': workflowGroupService.activateWorkflowGroup,
            'false': workflowGroupService.deactivateWorkflowGroup
        };

        self.globalServices = {
            'true': workflowGroupService.activateWorkflowGroup,
            'false': workflowGroupService.deactivateWorkflowGroup
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.workflowGroups = $filter('orderBy')(self.workflowGroups, self.grid.order);
        };

        /**
         * @description this method to reload the grid
         * @return {*|Promise<U>}
         */
        self.reloadWorkflowGroups = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return workflowGroupService.loadWorkflowGroups().then(function (result) {
                self.selectedWorkflowGroups = [];
                self.workflowGroups = result;
                self.workflowGroupsCopy = angular.copy(self.workflowGroups);
                defer.resolve(true);

                if (pageNumber)
                    self.grid.page = pageNumber;
                self.getSortedData();
                self.grid.searchCallback();
                return result;
            });
        };

        /**
         * @description Opens dialog for add new Workflow Group
         * @param $event
         */
        self.openAddWorkflowGroupDialog = function ($event) {
            workflowGroupService
                .controllerMethod
                .workflowGroupAdd(false, $event)
                .then(function (result) {
                    self.reloadWorkflowGroups(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getTranslatedName()}));
                        });
                })
        };

        /**
         * @description Opens dialog for edit Workflow Group
         * @param workflowGroup
         * @param $event
         */
        self.openEditWorkflowGroupDialog = function (workflowGroup, $event) {
            return workflowGroupService
                .controllerMethod
                .workflowGroupEdit(angular.copy(workflowGroup), false, $event)
                .then(function (result) {
                    self.reloadWorkflowGroups(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getTranslatedName()}));
                        });
                });
        };

        /**
         *remove single workflow Group
         * @param workflowGroup
         * @param $event
         */
        self.removeWorkflowGroup = function (workflowGroup, $event) {
            workflowGroupService
                .controllerMethod
                .workflowGroupDelete($event, workflowGroup)
                .then(function () {
                    self.reloadWorkflowGroups(self.grid.page);
                });
        };

        /**
         *remove bulk Workflow Groups
         * @param $event
         */
        self.removeWorkflowGroups = function ($event) {
            var listArr = self.selectedWorkflowGroups;

            var listIds = [];
            for (var i = 0; i < listArr.length; i++) {
                listIds.push(listArr[i].id);
            }

            workflowGroupService
                .controllerMethod
                .workflowGroupDeleteBulk(listIds)
                .then(function () {
                    self.reloadWorkflowGroups(self.grid.page);
                });
        };

        /**
         * change bulk Workflow Group status
         * @param status
         */
        self.changeBulkStatusWorkflowGroups = function (status) {
            self.statusServices[status](self.selectedWorkflowGroups).then(function () {
                self.selectedWorkflowGroups = [];
                toast.success(langService.get('selected_status_updated'));
                self.reloadWorkflowGroups(self.grid.page);
            });
        };

        /**
         * change single Workflow Group status
         * @param workflowGroup
         */
        self.changeStatusWorkflowGroup = function (workflowGroup) {
            self.statusServices[workflowGroup.status](workflowGroup)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    workflowGroup.status = !workflowGroup.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
        /**
         * change single Workflow Group Global
         * @param workflowGroup
         */
        self.changeGlobalWorkflowGroup = function (workflowGroup) {
            return workflowGroupService
                .controllerMethod
                .showGroupMembers(workflowGroup, $event);
        };
        /**
         * @description Change the globalization of Workflow Group
         * @param workflowGroup
         */
        self.changeGlobalWorkflowGroup = function (workflowGroup) {
            workflowGroupService.updateWorkflowGroup(workflowGroup)
                .then(function () {
                    toast.success(langService.get('globalization_success'));
                })
                .catch(function () {
                    workflowGroup.global = !workflowGroup.global;
                    dialog.errorMessage(langService.get('something_happened_when_update_global'));
                });
        };

        /**
         * open popup to show Group Members
         * @param workflowGroup
         * @param $event
         */
        self.openPopupWorkflowGroupMembers = function (workflowGroup, $event) {
            return workflowGroupService
                .controllerMethod
                .showGroupMembers(workflowGroup, $event);
        }

    });
};
