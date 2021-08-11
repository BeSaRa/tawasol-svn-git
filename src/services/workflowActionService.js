module.exports = function (app) {
    app.service('workflowActionService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   WorkflowAction,
                                                   _,
                                                   dialog,
                                                   langService,
                                                   toast,
                                                   employeeService,
                                                   FavoriteAction,
                                                   cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'workflowActionService';
        self.workflowActions = [];
        /**
         * @description Load the workflow actions from server.
         * @returns {Promise|workflowActions}
         */
        self.loadWorkflowActions = function () {
            return $http.get(urlService.workflowActions).then(function (result) {
                self.workflowActions = generator.generateCollection(result.data.rs, WorkflowAction, self._sharedMethods);
                self.workflowActions = generator.interceptReceivedCollection('WorkflowAction', self.workflowActions);
                return self.workflowActions;
            });
        };

        /**
         * @description Get workflow actions from self.workflowActions if found and if not load it from server again.
         * @returns {Promise|workflowActions}
         */
        self.getWorkflowActions = function () {
            return self.workflowActions.length ? $q.when(self.workflowActions) : self.loadWorkflowActions();
        };

        /**
         * @description Contains methods for CRUD operations for workflow actions
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new workflow action
             * @param $event
             */
            workflowActionAdd: function (tabIndex, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('workflow-action'),
                        controller: 'workflowActionPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            workflowAction: new WorkflowAction(
                                {
                                    itemOrder: generator.createNewID(self.workflowActions, 'itemOrder')
                                }),
                            workflowActions: self.workflowActions,
                            tabIndex: tabIndex
                        }
                    });
            },
            /**
             * @description Opens popup to edit workflow action
             * @param workflowAction
             * @param $event
             */
            workflowActionEdit: function (workflowAction, tabindex, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('workflow-action'),
                        controller: 'workflowActionPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            workflowAction: workflowAction,
                            workflowActions: self.workflowActions,
                            tabIndex: tabindex
                        }
                    });
            },
            /**
             * @description Show confirm box and delete workflow action
             * @param workflowAction
             * @param $event
             */
            workflowActionDelete: function (workflowAction, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: workflowAction.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteWorkflowAction(workflowAction).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: workflowAction.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk workflow actions
             * @param workflowActions
             * @param $event
             */
            workflowActionDeleteBulk: function (workflowActions, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkWorkflowActions(workflowActions)
                            .then(function (result) {
                                var response = false;
                                if (result.length === workflowActions.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (workflowAction) {
                                        return workflowAction.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };

        /**
         * @description Add new workflow action
         * @param workflowAction
         * @return {Promise|WorkflowAction}
         */
        self.addWorkflowAction = function (workflowAction) {
            return $http
                .post(urlService.workflowActions,
                    generator.interceptSendInstance('WorkflowAction', workflowAction))
                .then(function () {
                    return workflowAction;
                });
        };

        /**
         * @description Update the given workflow action.
         * @param workflowAction
         * @return {Promise|WorkflowAction}
         */
        self.updateWorkflowAction = function (workflowAction) {
            return $http
                .put(urlService.workflowActions,
                    generator.interceptSendInstance('WorkflowAction', workflowAction))
                .then(function (result) {
                    return result;
                });
        };

        /**
         * @description Delete given workflow action.
         * @param workflowAction
         * @return {Promise|null}
         */
        self.deleteWorkflowAction = function (workflowAction) {
            var id = workflowAction.hasOwnProperty('id') ? workflowAction.id : workflowAction;
            return $http.delete((urlService.workflowActions + '/' + id));
        };

        /**
         * @description Delete bulk workflow actions.
         * @param workflowActions
         * @return {Promise|null}
         */
        self.deleteBulkWorkflowActions = function (workflowActions) {

            var bulkIds = workflowActions[0].hasOwnProperty('id') ? _.map(workflowActions, 'id') : workflowActions;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.workflowActions + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedWorkflowActions = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedWorkflowActions.push(key);
                });
                return _.filter(workflowActions, function (workflowAction) {
                    return (failedWorkflowActions.indexOf(workflowAction.id) > -1);
                });
            });
        };

        /**
         * @description Get workflow action by workflowActionId
         * @param workflowActionId
         * @returns {WorkflowAction|undefined} return WorkflowAction Model or undefined if not found.
         */
        self.getWorkflowActionById = function (workflowActionId) {
            workflowActionId = workflowActionId instanceof WorkflowAction ? workflowActionId.id : workflowActionId;
            return _.find(self.workflowActions, function (workflowAction) {
                return Number(workflowAction.id) === Number(workflowActionId);
            });
        };

        /**
         * @description Activate workflow action
         * @param workflowAction
         */
        self.activateWorkflowAction = function (workflowAction) {
            return $http
                .put((urlService.workflowActions + '/activate/' + workflowAction.id))
                .then(function () {
                    return workflowAction;
                });
        };

        /**
         * @description Deactivate workflow action
         * @param workflowAction
         */
        self.deactivateWorkflowAction = function (workflowAction) {
            return $http
                .put((urlService.workflowActions + '/deactivate/' + workflowAction.id))
                .then(function () {
                    return workflowAction;
                });
        };

        /**
         * @description Activate bulk of workflow actions
         * @param workflowActions
         */
        self.activateBulkWorkflowActions = function (workflowActions) {
            var bulkIds = workflowActions[0].hasOwnProperty('id') ? _.map(workflowActions, 'id') : workflowActions;
            return $http
                .put((urlService.workflowActions + '/activate/bulk'), bulkIds)
                .then(function () {
                    return workflowActions;
                });
        };

        /**
         * @description Deactivate bulk of workflow actions
         * @param workflowActions
         */
        self.deactivateBulkWorkflowActions = function (workflowActions) {
            var bulkIds = workflowActions[0].hasOwnProperty('id') ? _.map(workflowActions, 'id') : workflowActions;
            return $http
                .put((urlService.workflowActions + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return workflowActions;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param workflowAction
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateWorkflowAction = function (workflowAction, editMode) {
            var workflowActionsToFilter = self.workflowActions;
            if (editMode) {
                workflowActionsToFilter = _.filter(workflowActionsToFilter, function (workflowActionToFilter) {
                    return workflowActionToFilter.id !== workflowAction.id;
                });
            }
            return _.some(_.map(workflowActionsToFilter, function (existingWorkflowAction) {
                return existingWorkflowAction.arName === workflowAction.arName
                    || existingWorkflowAction.enName.toLowerCase() === workflowAction.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteWorkflowAction, self.updateWorkflowAction);
        /**
         * @description Update the given workflow action.
         * @param applicationUser
         * @param workflowAction
         * @return {Promise|WorkflowAction}
         */
        self.saveWorkFlowRelatedUser = function (applicationUser, workflowAction) {

            var relatedData = {
                "userId": applicationUser.id,
                "wfAction": {
                    "id": workflowAction.id
                }
            };
            return $http
                .post(urlService.userWorkflowActions,
                    relatedData)
                .then(function () {
                    return workflowAction;
                });
        };
        /**
         * @description delete selected user from workflow action
         */
        self.deleteSelectedUserWorkFlow = function (id) {
            return $http.delete(urlService.userWorkflowActions + '/' + id);
        };

        self.deleteRelatedUsersWorkFlowBulk = function (workflowAction) {
            var releatedUsers = [];
            if (workflowAction.relatedUsers.length > 0) {
                for (var i in workflowAction.relatedUsers) {
                    releatedUsers.push(workflowAction.relatedUsers[i].id);
                }
            }
            return $http
                .delete((urlService.userWorkflowActions + '/bulk'), releatedUsers).then(function (result) {
                    return result;
                })
        };
        self.deleteBulkUserWorkflowActions = function (userWorkflowActions) {
            var bulkIds = userWorkflowActions[0].hasOwnProperty('selectedUserId') ? _.map(userWorkflowActions, 'selectedUserId') : userWorkflowActions;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.userWorkflowActions + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedUserWorkflowActions = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedUserWorkflowActions.push(key);
                });
                return _.filter(userWorkflowActions, function (userWorkflowAction) {
                    return (failedUserWorkflowActions.indexOf(userWorkflowAction.id) > -1);
                });
            });
        };
        /**
         * @description load current user workflow actions
         */
        self.loadCurrentUserWorkflowActions = function () {
            return $http.get(urlService.actionsDistributionWorkflow)
                .then(function (result) {
                    return generator.interceptReceivedCollection('WorkflowAction', generator.generateCollection(result.data.rs, WorkflowAction, self._sharedMethods));
                });
        }

        /**
         * @description load favorite user actions
         * @returns {*}
         */
        self.loadFavoriteActions = function () {
            return $http.get(urlService.favoriteWFActions + '/active')
                .then(function (result) {
                    return generator.interceptReceivedCollection('FavoriteAction', generator.generateCollection(result.data.rs, FavoriteAction, self._sharedMethods));
                });
        }

        /**
         * @description add/remove actions for user favorite
         */
        self.favoriteActions = function (actionIds) {
            var userId = employeeService.getEmployee().id;
            var favActions = _.map(actionIds, function (actionId, index) {
                return {
                    userId: userId,
                    actionId: actionId,
                    itemOrder: index + 1
                }
            })
            return $http.post(urlService.favoriteWFActions + '/bulk/user-id/' + userId, favActions)
        }

        self.openAddUserFavoriteActionDialog = function (favActions, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('favorite-actions'),
                    controller: 'favoriteActionsPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        favActions: favActions,
                    },
                    resolve: {
                        favoriteWFActions: function () {
                            'ngInject';
                            return self.loadWorkflowActions();
                        }
                    }
                });
        }
    });
};
