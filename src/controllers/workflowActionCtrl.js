module.exports = function (app) {
    app.controller('workflowActionCtrl', function (lookupService,
                                                   workflowActionService,
                                                   userWorkflowActions,
                                                   applicationUserService,
                                                   workflowActions,
                                                   $q,
                                                   $filter,
                                                   langService,
                                                   toast,
                                                   dialog,
                                                   contextHelpService,
                                                   userWorkflowActionService,
                                                   sidebarService,
                                                   gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowActionCtrl';
        contextHelpService.setHelpTo('workflow-actions');
        self.progress = null;

        /**
         * @description All workflow actions
         * @type {*}
         */
        self.workflowActions = workflowActions;

        /**
         * @description Contains the selected workflow actions
         * @type {Array}
         */
        self.selectedWorkflowActions = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.workflowAction) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.workflowAction, self.workflowActions),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.workflowAction, limit);
            }
        };

        /**
         * @description Contains methods for CRUD operations for workflow actions
         */
        self.statusServices = {
            'activate': workflowActionService.activateBulkWorkflowActions,
            'deactivate': workflowActionService.deactivateBulkWorkflowActions,
            'true': workflowActionService.activateWorkflowAction,
            'false': workflowActionService.deactivateWorkflowAction
        };

        /**
         * @description Opens dialog for add new workflow action
         * @param $event
         */
        self.openAddWorkflowActionDialog = function ($event) {
            workflowActionService
                .controllerMethod
                .workflowActionAdd(0, $event)
                .then(function (result) {
                    self.reloadWorkflowActions(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Opens dialog for edit workflow action
         * @param $event
         * @param workflowAction
         */
        self.openEditWorkflowActionDialog = function (workflowAction, tabIndex, $event) {
            workflowActionService
                .controllerMethod
                .workflowActionEdit(workflowAction, tabIndex, $event)
                .then(function (result) {
                    self.reloadWorkflowActions(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                }).catch(function () {
                self.reloadWorkflowActions(self.grid.page);
            });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.workflowActions = $filter('orderBy')(self.workflowActions, self.grid.order);
        };

        /**
         * @description Reload the grid of workflow action
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadWorkflowActions = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return userWorkflowActionService.loadUserWorkflowActions().then(function () {
                return workflowActionService
                    .loadWorkflowActions()
                    .then(function (result) {
                        self.workflowActions = result;
                        self.selectedWorkflowActions = [];
                        defer.resolve(true);
                        if (pageNumber)
                            self.grid.page = pageNumber;
                        self.getSortedData();
                        return self.workflowActions = result;
                    });
            });
        };

        /**
         * @description Check if the workflow action is reserved for system. If yes, don't allow to delete
         * @param workflowAction
         * @returns {boolean}
         */
        self.isReserved = function (workflowAction) {
            return workflowAction.id < 51;
        };

        /**
         * @description Delete single workflow action
         * @param workflowAction
         * @param $event
         */
        self.removeWorkflowAction = function (workflowAction, $event) {
            workflowActionService
                .controllerMethod
                .workflowActionDelete(workflowAction, $event)
                .then(function () {
                    self.reloadWorkflowActions(self.grid.page);
                });
        };
        /**
         * @description Delete multiple selected workflow actions
         * @param $event
         */
        self.removeBulkWorkflowActions = function ($event) {
            workflowActionService
                .controllerMethod
                .workflowActionDeleteBulk(self.selectedWorkflowActions, $event)
                .then(function () {
                    self.reloadWorkflowActions(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("delete_success"));
                        });
                });
        };

        /**
         * @description Change the status of workflow action
         * @param workflowAction
         */
        self.changeStatusWorkflowAction = function (workflowAction) {
            self.statusServices[workflowAction.status](workflowAction)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    workflowAction.status = !workflowAction.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
        /**
         * @description Change the status of selected workflow actions
         * @param status
         */
        self.changeStatusBulkWorkflowActions = function (status) {
            self.statusServices[status](self.selectedWorkflowActions)
                .then(function () {
                    self.reloadWorkflowActions(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };
        /**
         * @description Change the global of workflow action
         * @param workflowAction
         */
        self.changeGlobalWorkflowAction = function (workflowAction) {
            if (workflowAction.isGlobal) {
                if (workflowAction.relatedUsers.length > 0) {
                    dialog.confirmMessage(langService.get('related_user_confirm'))
                        .then(function () {
                            workflowActionService
                                .deleteBulkUserWorkflowActions(workflowAction.relatedUsers)
                                .then(function () {
                                    workflowAction.isGlobal = true;
                                    workflowActionService.updateWorkflowAction(workflowAction).then(function () {
                                        self.reloadWorkflowActions(self.grid.page).then(function () {
                                            toast.success(langService.get('delete_success'));
                                        });
                                    });
                                });
                        })
                        .catch(function () {
                            workflowAction.isGlobal = false;
                        });
                }
            }
            else {
                self.openEditWorkflowActionDialog(workflowAction, 1);
            }
        };
        self.openSelectRelatedUsersDialog = function (workflowAction) {
            return workflowAction
                .openDialogToSelectUsers()
                .then(function () {
                    return workflowAction;
                })
                .catch(function (reason) {
                    console.log(reason);
                });
        };
        /**
         * display for the global messages.
         * @param workflowAction
         */
        self.displayWorkflowActionGlobalMessage = function (workflowAction) {
            toast.success(langService.get('change_global_success')
                .change({
                    name: workflowAction.getTranslatedName(),
                    global: workflowAction.getTranslatedGlobal()
                }));
        };
    });
};