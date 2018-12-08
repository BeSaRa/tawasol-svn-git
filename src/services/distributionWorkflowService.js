module.exports = function (app) {
    app.service('distributionWorkflowService', function (urlService,
                                                         $http,
                                                         $q,
                                                         generator,
                                                         //DistributionWorkflow,
                                                         _,
                                                         dialog,
                                                         langService,
                                                         toast,
                                                         ApplicationUser,
                                                         DistributionWorkflowManager,
                                                         DistributionWorkflowOU,
                                                         DistributionWorkflowPrivateUser,
                                                         FavoriteUser,
                                                         FavoriteOU,
                                                         WorkflowAction,
                                                         DistributionWorkflowApplicationUser,
                                                         WorkflowGroupDistributionWorkflow,
                                                         DistributionWorkflowGovernmentEntity,
                                                         organizationService,
                                                         cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'distributionWorkflowService';

        self.distributionWorkflows = [];
        self.privateUsers = [];
        self.managers = [];
        self.ouGroups = [];
        self.favoriteUsers = [];
        self.favoriteOUs = [];
        self.actions = [];
        self.workflowGroups = [];
        self.governmentEntities = [];

        /**
         * @description Contains methods for CRUD operations for distribution Workflows
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to Send distribution Workflow
             * @param model
             * @param isForwardButton
             * @param isReplyButton
             * @param senderForReply
             * @param docClassName
             * @param $event
             */
            distributionWorkflowSend: function (model, isForwardButton, isReplyButton, senderForReply, docClassName, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('distribution-workflow'),
                        controller: 'distributionWorkflowPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            model: model,
                            isForwardButton: isForwardButton,
                            isReplyButton: isReplyButton,
                            senderForReply: senderForReply,
                            selectedBooks: [],
                            docClassName: docClassName
                        },
                        resolve: {
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.loadOrganizations();
                            },
                            actions: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadActions()
                                    .then(function (result) {
                                        return result;
                                    })
                                    .catch(function (error) {
                                        return [];
                                    });
                            },
                            favoriteUsers: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadFavoriteUsers();
                            },
                            favoriteOUs: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadFavoriteOUs();
                            },
                            workflowGroups: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadWorkflowGroups().then(function (result) {
                                    var wfGroups = [];
                                    for (var i = 0; i < result.length; i++) {
                                        var tempArr = _.pick(result[i], ['wfgroup']);
                                        wfGroups.push(tempArr.wfgroup);
                                    }
                                    return wfGroups;
                                });
                            },
                            userPreferences: function (employeeService) {
                                'ngInject';
                                return employeeService.getEmployee();
                            }
                        }
                    });

            },
            /**
             * @description opens popup to Send Bulk distribution Workflow
             * @param selectedBooks
             * @param docClassName
             * @param $event
             * @returns {promise}
             */
            distributionWorkflowSendBulk: function (selectedBooks, docClassName, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('distribution-workflow'),
                        controller: 'distributionWorkflowPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            model: null,
                            isForwardButton: false,
                            isReplyButton: false,
                            senderForReply: null,
                            selectedBooks: selectedBooks,
                            docClassName: docClassName
                        },
                        resolve: {
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.loadOrganizations();
                            },
                            actions: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadActions();
                            },
                            favoriteUsers: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadFavoriteUsers();
                            },
                            favoriteOUs: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadFavoriteOUs();
                            },
                            workflowGroups: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadWorkflowGroups().then(function (result) {
                                    var wfGroups = [];
                                    for (var i = 0; i < result.length; i++) {
                                        var tempArr = _.pick(result[i], ['wfgroup']);
                                        wfGroups.push(tempArr.wfgroup);
                                    }
                                    return wfGroups;
                                });
                            },
                            userPreferences: function (employeeService) {
                                'ngInject';
                                return employeeService.getEmployee();
                            }
                        }
                    });

            },
            /**
             * @description Opens popup to add normal OU to send distribution workflow
             * @param enableSMSNotification
             * @param enableEmailNotification
             * @param minDate
             * @param escalationProcessList
             * @param $event
             */
            distributionWorkflowAddReceivedOU: function (enableSMSNotification, enableEmailNotification, minDate, escalationProcessList, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('distribution-workflow-add-organization'),
                        controller: 'distributionWorkflowAddOUPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            enableSMSNotification: enableSMSNotification,
                            enableEmailNotification: enableEmailNotification,
                            minDate: minDate,
                            escalationProcessList: escalationProcessList
                        },
                        resolve: {
                            organizations: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadOrganizationWithoutReg();
                            },
                            flatArrayRegOU: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadOrganizationWithoutRegistry();
                            },
                            actions: function (distributionWorkflowService) {
                                'ngInject';
                                return distributionWorkflowService.loadActions();
                            }
                        }
                    });
            }
        };

        /**
         * @description Load the favorite users from server.
         * @returns {Promise}
         */
        self.loadFavoriteUsers = function () {
            return $http.get(urlService['favoriteUserDW'] + "/UsersList").then(function (result) {
                self.favoriteUsers = generator.generateCollection(result.data.rs, FavoriteUser, self._sharedMethods);
                return self.favoriteUsers;
            })
                .catch(function () {
                    return [];
                });
        };

        /**
         * @description Load the favorite OU from server.
         * @returns {Promise}
         */
        self.loadFavoriteOUs = function () {
            return $http.get(urlService['favoriteUserDW'] + "/OUsList").then(function (result) {
                self.favoriteOUs = generator.generateCollection(result.data.rs, FavoriteOU, self._sharedMethods);
                self.favoriteOUs = generator.interceptReceivedCollection('FavoriteOU', result.data.rs);
                return self.favoriteOUs;
            })
                .catch(function () {
                    return [];
                });
        };

        /**
         * @description Load the private users from server.
         * @returns {Promise|privateUsers}
         */
        self.loadPrivateUsers = function () {
            return $http.get(urlService.privateUsers).then(function (result) {
                self.privateUsers = generator.generateCollection(result.data.rs, DistributionWorkflowPrivateUser, self._sharedMethods);
                return self.privateUsers;
            });
        };

        /**
         * @description Load the application users from server.
         * @returns {Promise|applicationUsers}
         */
        self.loadAllApplicationUsers = function () {
            return $http.get(urlService.applicationUsers + "/dist/dist-users").then(function (result) {
                self.applicationUsers = generator.generateCollection(result.data.rs, DistributionWorkflowApplicationUser, self._sharedMethods);
                //self.applicationUsers = generator.interceptReceivedCollection('ApplicationUser', self.applicationUsers);
                return self.applicationUsers;
            });
        };

        /**
         * @description search the application users
         * @param searchText
         * @param searchKey
         */
        self.searchApplicationUsersByText = function (searchText, searchKey) {
            return $http.get(urlService.applicationUsers + "/dist/like/key/" + searchKey.key + "/val/" + searchText).then(function (result) {
                self.applicationUsers = generator.generateCollection(result.data.rs, DistributionWorkflowApplicationUser, self._sharedMethods);
                return self.applicationUsers;
            });
        };

        /**
         * @description Load OU from server.
         * @returns {Promise}
         */
        self.loadOrganizationGroups = function () {
            return $http.get(urlService['ouDistributionWorkflow']).then(function (result) {
                self.ouGroups = generator.generateCollection(result.data.rs, DistributionWorkflowOU, self._sharedMethods);
                self.ouGroups = generator.interceptReceivedCollection('DistributionWorkflowOU', result.data.rs);
                return self.ouGroups;
            });
        };

        self.loadOrganizationWithoutRegistry = function () {
            return organizationService.loadOrganizations()
                .then(function (result) {
                    result = _.filter(result, function (organization) {
                        return !organization.hasRegistry;
                    });
                    return result;
                })
        };

        self.organizationsWithoutReg = [];
        /**
         * @description get organizations without registry
         */
        self.loadOrganizationWithoutReg = function () {
            return organizationService.loadOrganizations()
                .then(function (result) {
                    result = _.filter(result, function (organization) {
                        return !organization.hasRegistry;
                    });
                    self.flatArrayRegOU = angular.copy(result);
                    result = getRootOrganizations(result);
                    self.organizationsWithoutReg = self.separateParentFromChildren(result).getChildrenForParents(self.parentOUs);
                    return self.organizationsWithoutReg;
                })
        };

        /**
         * @description make the parent property to NULL for root parents to get children
         * @param arr
         * @returns {*}
         */
        function getRootOrganizations(arr) {
            var isParentExist = [];
            for (var i = 0; i < arr.length; i++) {
                for (var j = 0; j < arr.length; j++) {
                    if (arr[i].id !== arr[j].id) {
                        if (arr[i].parent === arr[j].id) {
                            isParentExist.push(arr[i]);
                            // continue;
                        }
                    }
                }
                //if parent not exist then it is root
                if (isParentExist.length === 0) {
                    arr[i].parent = null;
                } else {
                    isParentExist = [];
                }
            }
            return arr;
        }

        self.getChildrenForParents = function (parentOUs) {
            for (var i = 0; i < parentOUs.length; i++) {
                if (self.childrenOUs.hasOwnProperty(parentOUs[i].id)) {
                    parentOUs[i].children = self.childrenOUs[parentOUs[i].id];
                } else {
                    parentOUs[i].children = [];
                }
                if (parentOUs[i].children) {
                    self.getChildrenForParents(parentOUs[i].children);
                }
            }
            return parentOUs;
        };

        self.separateParentFromChildren = function (organizations) {
            self.parentOUs = [];
            self.childrenOUs = {};
            _.map(organizations, function (ou) {
                if (!ou.parent) {
                    self.parentOUs.push(ou);
                } else {
                    if (!self.childrenOUs.hasOwnProperty(ou.parent)) {
                        self.childrenOUs[ou.parent] = [];
                    }
                    self.childrenOUs[ou.parent].push(ou);
                }
            });
            return self;
        };

        /**
         * @description Find application users by search text and search key
         * @param searchText
         * @param searchKey
         * @return {*|Promise<U>}
         */
        self.findUsersByText = function (searchText, searchKey) {
            // service-request: need service to return collection of users from backend-team based on search text.
            return self.loadAllApplicationUsers().then(function (result) {
                return _.filter(result, function (applicationUser) {
                        if (searchKey.key !== 'organizationUnit')
                            return applicationUser[searchKey.key].toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
                        else
                            return (Number(applicationUser[searchKey.key]) === Number(searchText));
                    }
                );
            });
        };

        /**
         * @description Find private application users by search text and search key
         * @param searchText
         * @param searchKey
         * @return {*|Promise<U>}
         */
        self.findPrivateUsersByText = function (searchText, searchKey) {
            // service-request: need service to return collection of users from backend-team based on search text.
            searchText = searchText.toLowerCase().trim();
            return self.loadPrivateUsers().then(function (result) {
                return _.filter(result, function (privateUser) {
                        var properties = [
                            'arName',
                            'enName'];

                        if (!searchKey) {
                            var found = false;
                            var value = "";
                            for (var i = 0; i < properties.length; i++) {
                                value = privateUser[properties[i]].toString().toLowerCase().trim();
                                if (value.indexOf(searchText) !== -1) {
                                    found = true;
                                    break;
                                }
                            }
                            return found;
                        }
                        return privateUser[searchKey.key].toLowerCase().indexOf(searchText) !== -1;
                    }
                );
            });
        };

        /**
         * @description Find OU group by search text and search key
         * @param searchText
         * @param searchKey
         * @return {*|Promise<U>}
         */
        self.findOrganizationGroupsByText = function (searchText, searchKey) {
            // service-request: need service to return collection of users from backend-team based on search text.
            searchText = searchText.toLowerCase().trim();
            return self.loadOrganizationGroups().then(function (result) {
                return _.filter(result, function (organizationGroup) {
                        var properties = [
                            'arName',
                            'enName'];

                        if (!searchKey) {
                            var found = false;
                            var value = "";
                            for (var i = 0; i < properties.length; i++) {
                                value = organizationGroup[properties[i]].toString().toLowerCase().trim();
                                if (value.indexOf(searchText) !== -1) {
                                    found = true;
                                    break;
                                }
                            }
                            return found;
                        }

                        return organizationGroup[searchKey.key].toLowerCase().indexOf(searchText) !== -1;

                    }
                );
            });
        };

        /**
         * @description load manager users for Organization
         * @param ouId
         */
        self.getManagersForOU = function (ouId) {
            return $http.get(urlService.managerDistributionWorkflow + "/" + ouId).then(function (result) {
                self.managers = generator.generateCollection(result.data.rs, DistributionWorkflowManager, self._sharedMethods);
                return self.managers;
            }).catch(function () {
                return [];
            });
        };

        /**
         * @description load workflow group from server
         */
        self.loadWorkflowGroups = function () {
            return $http.get(urlService.workflowGroupDistributionWorkflow).then(function (result) {
                self.workflowGroups = generator.generateCollection(result.data.rs, WorkflowGroupDistributionWorkflow, self._sharedMethods);
                return self.workflowGroups;
            }).catch(function () {
                return [];
            });
        };

        /**
         * @description load Government Entity Users from server
         */
        self.loadGovernmentEntityUsers = function () {
            return $http.get(urlService.governmentEntityDistributionWorkflow).then(function (result) {
                self.governmentEntities = generator.generateCollection(result.data.rs, DistributionWorkflowGovernmentEntity, self._sharedMethods);
                return self.governmentEntities;
            });
        };

        /**
         * @description load actions
         */
        self.loadActions = function () {
            return $http.get(urlService['actionsDistributionWorkflow']).then(function (result) {
                self.actions = generator.generateCollection(result.data.rs, WorkflowAction, self._sharedMethods);
                return self.actions;
            })
        };

        /**
         * add bulk favorite OUs
         * @param bulkOUIds
         */
        self.addBulkFavoriteOU = function (bulkOUIds) {
            return $http
                .post(urlService['favoriteUserDW'] + "/bulkOUs", bulkOUIds)
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description remove bulk favorite OUs
         * @param bulkOUIds
         */
        self.removeBulkFavoriteOU = function (bulkOUIds) {
            //var bulkIds = applicationUsers[0].hasOwnProperty('id') ? _.map(applicationUsers, 'id') : applicationUsers;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService['favoriteUserDW'] + '/bulk',
                data: bulkOUIds
            }).then(function (result) {
                return result;
            });
        };

        /**
         * @description remove bulk favorite users
         * @param bulkUserIds
         */
        self.removeBulkFavoriteUsers = function (bulkUserIds) {
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService['favoriteUserDW'] + '/bulk',
                data: bulkUserIds
            }).then(function (result) {
                return result;
            });
        };

        /**
         * @description add single favorite OU
         * @param ouGroupId
         */
        self.addSingleFavoriteOU = function (ouGroupId) {
            return $http
                .post(urlService['favoriteUserDW'], ouGroupId)
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description add bulk favorite users
         * @param bulkUserIds
         */
        self.addBulkFavoriteUser = function (bulkUserIds) {
            return $http
                .post(urlService['favoriteUserDW'] + "/users-bulk", bulkUserIds)
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description add single favorite user
         * @param userId
         */
        self.addSingleFavoriteUser = function (userId) {
            return $http
                .post(urlService['favoriteUserDW'], userId)
                .then(function (result) {
                    return result.data.rs;
                });
        };

        self.removeSingleFavoriteUser = function (relationId) {
            return $http.delete((urlService['favoriteUserDW'] + '/' + relationId)).then(function (result) {
                return result.data.rs;
            });
        };

        self.removeSingleFavoriteOU = function (ouGroupId) {
            return $http.delete((urlService['favoriteUserDW'] + '/' + ouGroupId)).then(function (result) {
                return result.data.rs;
            });
        };

        /**
         * @description send distribution Workflow Users
         * @param distributionWorkflowUsers
         * @param vsId
         * @param classDescription
         */
        self.sendDistributionWorkflow = function (distributionWorkflowUsers, vsId, classDescription) {
            return $http
                .post(urlService.sendDistributionWorkflow.replace("{{documentClass}}", classDescription.toLowerCase()) + "/vsid/" + vsId,
                    generator.interceptSendInstance('SendDistributionWorkflow', distributionWorkflowUsers))
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description forward distribution Workflow Users
         * @param distributionWorkflowUsers
         * @param vsId
         * @param workObjectNumber
         * @param classDescription
         */
        self.forwardDistributionWorkflow = function (distributionWorkflowUsers, vsId, workObjectNumber, classDescription) {
            return $http
                .post(urlService.sendDistributionWorkflow.replace("{{documentClass}}", classDescription.toLowerCase()) + "/" + vsId + "/forward/" + workObjectNumber,
                    generator.interceptSendInstance('SendDistributionWorkflow', distributionWorkflowUsers))
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description send bulk distribution workflow
         * @param distributionWorkflowBulk
         * @param classDescription
         */
        self.sendDistributionWorkflowBulk = function (distributionWorkflowBulk, classDescription) {
            return $http
                .post(urlService.sendDistributionWorkflow.replace("{{documentClass}}", classDescription.toLowerCase()) + "/bulk",
                    generator.interceptSendInstance('DistributionWorkflowBulk', distributionWorkflowBulk))
                .then(function (result) {
                    result = result.data.rs;
                    var failedRecords = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedRecords.push(key);
                    });
                    return failedRecords;
                });
        };

        self.deleteDistributionWorkflow = function () {

        };

        self.updateDistributionWorkflow = function () {

        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDistributionWorkflow, self.updateDistributionWorkflow);
    });
};
