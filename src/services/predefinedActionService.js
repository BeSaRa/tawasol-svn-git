module.exports = function (app) {
    app.service('predefinedActionService', function (urlService,
                                                     $http,
                                                     $q,
                                                     _,
                                                     generator,
                                                     PredefinedAction,
                                                     cmsTemplate,
                                                     dialog,
                                                     langService,
                                                     toast,
                                                     employeeService,
                                                     Information,
                                                     DistributionUserWFItem,
                                                     DistributionOUWFItem) {
        'ngInject';
        var self = this;
        self.serviceName = 'predefinedActionService';

        self.predefinedActions = [];

        /**
         * @description Loads all predefined actions for user
         * @returns {*}
         */
        self.loadPredefinedActionsForUser = function ($event) {
            return $http.get(urlService.predefinedAction + '/user/all')
                .then(function (result) {
                    self.predefinedActions = generator.generateCollection(result.data.rs, PredefinedAction, self._sharedMethods);
                    self.predefinedActions = generator.interceptReceivedCollection('PredefinedAction', self.predefinedActions);
                    return self.predefinedActions;
                });
        };

        /**
         * @description Get all predefined actions from self.predefinedActions if found and if not load it from server again.
         * @returns {*}
         */
        self.getPredefinedActionsForUser = function () {
            return self.predefinedActions.length ? $q.when(self.predefinedActions) : self.loadPredefinedActionsForUser();
        };

        /**
         * @description Loads all active predefined actions for user
         * @returns {*}
         */
        self.loadPredefinedActionById = function (predefinedActionId) {
            predefinedActionId = predefinedActionId.hasOwnProperty('id') ? predefinedActionId.id : predefinedActionId;
            return $http.get(urlService.predefinedAction + '/' + predefinedActionId)
                .then(function (result) {
                    var predefinedAction = generator.generateInstance(result.data.rs, PredefinedAction, self._sharedMethods);
                    predefinedAction = generator.interceptReceivedInstance('PredefinedAction', predefinedAction);
                    return predefinedAction;
                });
        };

        /**
         * @description Loads all active predefined actions for user
         * @returns {*}
         */
        self.loadActivePredefinedActionsForUser = function () {
            return $http.get(urlService.predefinedAction + '/user/active')
                .then(function (result) {
                    var predefinedActions = generator.generateCollection(result.data.rs, PredefinedAction, self._sharedMethods);
                    predefinedActions = generator.interceptReceivedCollection('PredefinedAction', predefinedActions);
                    return predefinedActions;
                });
        };
        /**
         * @description Loads all active predefined actions for user as information model
         * @returns {*}
         */
        self.loadActivePredefinedActionsForUserAsDistWF = function () {
            return $http.get(urlService.predefinedAction + '/dist/user')
                .then(function (result) {
                    var predefinedActions = generator.generateCollection(result.data.rs, Information, self._sharedMethods);
                    predefinedActions = generator.interceptReceivedCollection('Information', predefinedActions);
                    return predefinedActions;
                });
        };


        /**
         * @description Contains methods for CRUD operations for predefined actions
         */
        self.controllerMethod = {
            predefinedActionAdd: function ($event) {
                var errorMessage = [], action = 'forward', tab = 'favorites';
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('predefined-action'),
                        controller: 'predefinedActionPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            predefinedAction: new PredefinedAction({
                                userId: employeeService.getEmployee().id,
                                ouId: employeeService.getEmployee().getOUID()
                            }),
                            selectedTab: tab,
                            actionKey: action,
                            errorMessage: errorMessage
                        },
                        resolve: {
                            favoritesUsers: function (distributionWFService) {
                                'ngInject';
                                return distributionWFService.loadFavorites('users')
                                    .catch(function () {
                                        errorMessage.push('users');
                                        return [];
                                    });
                            },
                            favoritesOrganizations: function (distributionWFService) {
                                'ngInject';
                                return distributionWFService.loadFavorites('organizations')
                                    .catch(function () {
                                        errorMessage.push('organizations');
                                        return [];
                                    });
                            },
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            },
                            workflowActions: function (workflowActionService) {
                                'ngInject';
                                return workflowActionService.loadCurrentUserWorkflowActions()
                            },
                            // used to show regou name infront of section in users tab (ou dropdown)
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getOrganizations();
                            },
                            organizationGroups: function (distributionWFService) {
                                'ngInject';
                                return distributionWFService
                                    .loadDistWorkflowOrganizations('organizations')
                            },
                            centralArchiveOUs: function (distributionWFService) {
                                'ngInject';
                                if (employeeService.hasPermissionTo('SEND_TO_CENTRAL_ARCHIVE')) {
                                    return distributionWFService
                                        .loadDistWorkflowOrganizations('centralArchivesForUser')
                                        .then(function (result) {
                                            return result;
                                        })
                                        .catch(function (error) {
                                            return [];
                                        })
                                }
                                return [];
                            }
                        }
                    })
            },
            predefinedActionEdit: function (predefinedAction, $event) {
                var errorMessage = [], action = 'forward', tab = 'favorites';
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('predefined-action'),
                        controller: 'predefinedActionPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            selectedTab: tab,
                            actionKey: action,
                            errorMessage: errorMessage
                        },
                        resolve: {
                            predefinedAction: function () {
                                'ngInject';
                                return self.loadPredefinedActionById(predefinedAction);
                            },
                            favoritesUsers: function (distributionWFService) {
                                'ngInject';
                                return distributionWFService.loadFavorites('users')
                                    .catch(function () {
                                        errorMessage.push('users');
                                        return [];
                                    });
                            },
                            favoritesOrganizations: function (distributionWFService) {
                                'ngInject';
                                return distributionWFService.loadFavorites('organizations')
                                    .catch(function () {
                                        errorMessage.push('organizations');
                                        return [];
                                    });
                            },
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            },
                            workflowActions: function (workflowActionService) {
                                'ngInject';
                                return workflowActionService.loadCurrentUserWorkflowActions()
                            },
                            // used to show regou name infront of section in users tab (ou dropdown)
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getOrganizations();
                            },
                            organizationGroups: function (distributionWFService) {
                                'ngInject';
                                return distributionWFService
                                    .loadDistWorkflowOrganizations('organizations')
                            },
                            centralArchiveOUs: function (distributionWFService) {
                                'ngInject';
                                if (employeeService.hasPermissionTo('SEND_TO_CENTRAL_ARCHIVE')) {
                                    return distributionWFService
                                        .loadDistWorkflowOrganizations('centralArchivesForUser')
                                        .then(function (result) {
                                            return result;
                                        })
                                        .catch(function (error) {
                                            return [];
                                        })
                                }
                                return [];
                            }
                        }
                    })
            },
            predefinedActionDelete: function (predefinedAction, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: predefinedAction.getNames()}))
                    .then(function () {
                        return self.deletePredefinedAction(predefinedAction).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: predefinedAction.getNames()}));
                            return true;
                        })
                    });
            },
            predefinedActionDeleteBulk: function (predefinedActions, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function (result) {
                        return self.deleteBulkPredefinedActions(predefinedActions);
                    });
            }
        };

        /**
         * @description delete given predefined action.
         * @param predefinedAction
         * @return {Promise|null}
         */
        self.deletePredefinedAction = function (predefinedAction) {
            var id = predefinedAction.hasOwnProperty('id') ? predefinedAction.id : predefinedAction;
            return $http.delete(urlService.predefinedAction + '/' + id).then(function (result) {
                return result;
            });
        };

        /**
         * @description delete bulk predefined actions.
         * @param predefinedActions
         * @return {Promise|null}
         */
        self.deleteBulkPredefinedActions = function (predefinedActions) {
            var bulkIds = predefinedActions[0].hasOwnProperty('id') ? _.map(predefinedActions, 'id') : predefinedActions;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.predefinedAction + '/bulk',
                data: bulkIds
            }).then(function (result) {
                return generator.getBulkActionResponse(result, predefinedActions, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following');
            });
        };

        /**
         * @description activate predefined action
         * @param predefinedAction
         */
        self.activatePredefinedAction = function (predefinedAction) {
            return $http
                .put((urlService.predefinedAction + '/activate/' + predefinedAction.id))
                .then(function () {
                    return predefinedAction;
                });
        };

        /**
         * @description Deactivate predefined action
         * @param predefinedAction
         */
        self.deactivatePredefinedAction = function (predefinedAction) {
            return $http
                .put((urlService.predefinedAction + '/deactivate/' + predefinedAction.id))
                .then(function () {
                    return predefinedAction;
                });
        };

        /**
         * @description Activate bulk of predefined actions
         * @param predefinedActions
         */
        self.activateBulkPredefinedActions = function (predefinedActions) {
            return $http
                .put((urlService.predefinedAction + '/activate/bulk'), _.map(predefinedActions, 'id'))
                .then(function (result) {
                    return generator.getBulkActionResponse(result, predefinedActions, false, 'failed_activate_selected', 'success_activate_selected', 'success_activate_selected_except_following');
                });
        };

        /**
         * @description Deactivate bulk of predefined actions
         * @param predefinedActions
         */
        self.deactivateBulkPredefinedActions = function (predefinedActions) {
            return $http
                .put((urlService.predefinedAction + '/deactivate/bulk'), _.map(predefinedActions, 'id'))
                .then(function (result) {
                    return generator.getBulkActionResponse(result, predefinedActions, false, 'failed_deactivate_selected', 'success_deactivate_selected', 'success_deactivate_selected_except_following');
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param predefinedAction
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicatePredefinedAction = function (predefinedAction, editMode) {
            var allRecords = self.predefinedActions;
            if (editMode) {
                allRecords = _.filter(allRecords, function (record) {
                    return record.id !== predefinedAction.id;
                });
            }
            return _.some(_.map(allRecords, function (existingRecord) {
                return existingRecord.arName === existingRecord.arName
                    || existingRecord.enName.toLowerCase() === existingRecord.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        self.addPredefinedAction = function (predefinedAction, $event) {
            return $http
                .post(urlService.predefinedAction,
                    generator.interceptSendInstance('PredefinedAction', predefinedAction))
                .then(function (result) {
                    predefinedAction.id = result.data.rs;
                    return predefinedAction;
                });
        };

        self.updatePredefinedAction = function (predefinedAction, $event) {
            return $http
                .put(urlService.predefinedAction,
                    generator.interceptSendInstance('PredefinedAction', predefinedAction))
                .then(function () {
                    return generator.interceptReceivedInstance('PredefinedAction', generator.generateInstance(predefinedAction, PredefinedAction, self._sharedMethods));
                });
        };


        /**
         * @description Converts the predefined action members to distribution workflow items(users/organizations)
         * @param predefinedActionMembers
         * @param fromLaunch
         * @param returnPromise
         * @returns {*}
         */
        self.typeCastMembersToDistributionWFItems = function (predefinedActionMembers, fromLaunch, returnPromise) {
            var selectedWorkflowItems = [];
            var users = [], groupMails = [], organizations = [];
            _.map(predefinedActionMembers, function (member) {
                if (member.isUserMember()) {
                    users.push(member);
                } else if (member.isGroupMailMember()) {
                    groupMails.push(member);
                } else if (member.isOrganizationMember()) {
                    organizations.push(member);
                }
                return member;
            });
            selectedWorkflowItems = [].concat(_mapPredefinedActionMemberUsers(users, null, fromLaunch))
                .concat(_mapPredefinedActionMemberOrganizations(groupMails, 'OUGroup', fromLaunch))
                .concat(_mapPredefinedActionMemberOrganizations(organizations, 'OUReg', fromLaunch));

            return returnPromise ? $q.resolve(selectedWorkflowItems) : selectedWorkflowItems;
        };

        function _mapPredefinedActionMemberUsers(collection, gridName, fromLaunch) {
            return _.map(collection, function (workflowUser) {
                return (new DistributionUserWFItem()).mapFromPredefinedActionMemberUser(workflowUser, fromLaunch).setGridName(gridName || null);
            });
        }

        function _mapPredefinedActionMemberOrganizations(collection, gridName, fromLaunch) {
            return _.map(collection, function (workflowOrganization) {
                if (gridName === 'OUGroup') {
                    workflowOrganization.sLADueDate = null;
                }
                return (new DistributionOUWFItem()).mapFromPredefinedActionMemberOrganization(workflowOrganization, fromLaunch).setGridName(gridName || null);
            });
        }

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deletePredefinedAction, self.updatePredefinedAction);

    });
};
