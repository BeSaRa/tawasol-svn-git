const {UrlService} = require("@uirouter/angularjs");
module.exports = function (app) {
    app.service('distributionWFService', function (urlService,
                                                   WFUser,
                                                   WFOrganization,
                                                   WFGroup,
                                                   $timeout,
                                                   DistributionBulk,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   UserSearchCriteria,
                                                   cmsTemplate,
                                                   dialog,
                                                   errorCode,
                                                   langService,
                                                   MinistryAssistant,
                                                   UserComment,
                                                   WorkflowAction,
                                                   _) {
        'ngInject';
        var self = this;
        self.serviceName = 'distributionWFService';
        // private users
        self.favoriteUsers = [];
        // private organizations
        self.favoriteOrganizations = [];
        // all available workflow users
        self.workflowUsers = [];

        self.privateUsers = [];

        self.governmentEntitiesHeads = [];

        self.managerUsers = [];
        self.viceManagerUsers = [];
        self.registryOrganizations = [];

        self.organizationGroups = [];

        self.workflowGroups = [];

        function _emptyDistributionWFData() {
            _.map(self, function (item, index) {
                if (angular.isArray(item)) {
                    self[index] = [];
                }
            });
        }

        // all favorites segment urls.
        self.favoriteUrlMap = {
            users: {
                url: 'users',
                model: WFUser,
                property: 'favoriteUsers'
            },
            organizations: {
                url: 'ous',
                model: WFOrganization,
                property: 'favoriteOrganizations'
            }
        };
        // distributionWFEUsers
        // distributionWFPrivate
        // distributionWFManager
        self.usersMap = {
            heads: {
                url: urlService.distributionWFEUsers,
                property: 'governmentEntitiesHeads'
            },
            privates: {
                url: urlService.distributionWFPrivate,
                property: 'privateUsers'
            },
            managers: {
                url: urlService.distributionWFManagers,
                property: 'managerUsers'
            },
            viceManagers: {
                url: urlService.distributionWFViceManagers,
                property: 'viceManagerUsers'
            }
        };

        self.organizationsMap = {
            registry: {
                url: urlService.distributionWFREGOrganization,
                property: 'registryOrganizations'
            },
            organizations: {
                url: urlService.distributionWFOrganization + '?as-dist-wf=true',
                property: 'organizationGroups'
            },
            centralArchivesForUser: {
                url: urlService.distributionWFCentralArchiveForUser,
                property: 'centralArchives'
            }
        };
        /**
         * @description  load dist workflow Users
         * @param name
         */
        self.loadDistWorkflowUsers = function (name) {
            return $http.get(self.usersMap[name].url).then(function (result) {
                return self[self.usersMap[name].property] = generator.generateCollection(result.data.rs, WFUser);
            }).catch(function (e) {
                return [];
            });
        };
        /**
         * @description to user it on demand.
         * @param name
         * @param force
         * @returns {Promise}
         */
        self.getDistWorkflowUsers = function (name, force) {
            return !force && self[self.usersMap[name].property].length ? $q.when(self[self.usersMap[name].property]) : self.loadDistWorkflowUsers(name);
        };
        /**
         * @description load dist
         * @param name
         */
        self.loadDistWorkflowOrganizations = function (name) {
            return $http.get(self.organizationsMap[name].url).then(function (result) {
                if (name === 'centralArchivesForUser') {
                    if (!result.data.rs || result.data.rs.id === -1) {
                        result.data.rs = [];
                    } else if (!angular.isArray(result.data.rs))
                        result.data.rs = [result.data.rs];
                }
                self[self.organizationsMap[name].property] = generator.generateCollection(result.data.rs, WFOrganization);
                return self[self.organizationsMap[name].property]
            });
        };
        /**
         * @description to use it for on demand
         * @param name
         * @param force
         * @returns {Promise}
         */
        self.getDistWorkflowOrganizations = function (name, force) {
            return !force && self[self.organizationsMap[name].property].length ? $q.when(self[self.organizationsMap[name].property]) : self.loadDistWorkflowOrganizations(name);
        };
        /**
         * @description load dist workflow Groups
         */
        self.loadDistWorkflowGroups = function () {
            return $http.get(urlService.distributionWFGroups).then(function (result) {
                return self.workflowGroups = generator.interceptReceivedCollection('WFGroup', result.data.rs);
            });
        };
        /**
         * @description to use it for on demand.
         * @param force
         * @returns {Promise}
         */
        self.getDistWorkflowGroups = function (force) {
            return !force && self.workflowGroups.length ? $q.when(self.workflowGroups) : self.loadDistWorkflowGroups();
        };
        /**
         * @description load sender information to prepare reply.
         * @param workItem
         */
        self.loadSenderUserForWorkItem = function (workItem) {
            var info = workItem.getInfo();
            return $http.get(urlService.distributionWFSender.replace('{wobNum}', info.wobNumber))
                .then(function (result) {
                    return generator.generateInstance(result.data.rs, WFUser);
                });
        };

        /**
         * @description map bulk organizations.
         * @param items
         * @returns {Array}
         * @private
         */
        function _mapBulkOrganization(items) {
            return _.map(items, function (item) {
                return {
                    first: item.frequentUserOUID,
                    second: null
                }
            });
        }

        /**
         * @description map bulk users
         * @param items
         * @returns {Array}
         * @private
         */
        function _mapBulkUsers(items) {
            return _.map(items, function (item) {
                return {
                    first: item.frequentUserId,
                    second: item.frequentUserOUID
                }
            });
        }

        /**
         * @description to map bulk depend on this type
         * @param items
         * @param type
         * @returns {*}
         * @private
         */
        function _mapBulkType(items, type) {
            return type === 'Organization' ? _mapBulkOrganization(items) : _mapBulkUsers(items);
        }

        /**
         * @description load favorites ( users , organization )
         * @param favoritesName
         */
        self.loadFavorites = function (favoritesName) {
            return $http.get(urlService.favoritesDWF + '/' + self.favoriteUrlMap[favoritesName].url, {
                loading: false
            })
                .then(function (result) {
                    self[self.favoriteUrlMap[favoritesName].property] = generator.generateCollection(result.data.rs, self.favoriteUrlMap[favoritesName].model);
                    return self[self.favoriteUrlMap[favoritesName].property];
                });
        };
        /**
         * @description search for distribution users by criteria
         * @param searchCriteria
         * @param checkOUHasRegistry
         */
        self.searchUsersByCriteria = function (searchCriteria, checkOuHasRegistry) {
            if (checkOuHasRegistry) {
                searchCriteria = {...searchCriteria, regOu: searchCriteria.ou, ou: null};
            }

            return $http.post(urlService.distributionWF + '/search', generator.interceptSendInstance('UserSearchCriteria', searchCriteria))
                .then(function (result) {
                    return generator.interceptReceivedCollection('WFUser', generator.generateCollection(result.data.rs, WFUser));
                });
        };
        /**
         * @description search for followup distribution users by criteria
         * @param searchCriteria
         */
        self.searchFollowupUsersByCriteria = function (searchCriteria) {
            return $http.post(urlService.distributionWF + '/follow-up/search', generator.interceptSendInstance('UserSearchCriteria', searchCriteria))
                .then(function (result) {
                    return generator.interceptReceivedCollection('WFUser', generator.generateCollection(result.data.rs, WFUser));
                });
        };
        /**
         * @description load workflow users
         */
        self.loadWorkflowUsers = function () {
            return $http.get(urlService.applicationUsers + '/dist/dist-users')
                .then(function (result) {
                    return self.workflowUsers = generator.interceptReceivedCollection('WFUser', generator.generateCollection(result.data.rs, WFUser));
                });
        };
        /**
         * @description toggle fav for workflowItem
         * @param workflowItem
         * @param type
         */
        self.toggleFavoriteWFItem = function (workflowItem, type) {
            var method = !workflowItem.relationId ? 'add' : 'remove';
            return self[method + 'WorkflowItemFavorite'](workflowItem, type).then(function (result) {
                return {
                    action: method === 'add',
                    id: result
                }
            });
        };
        /**
         * @description add workflowItem to fav list.
         * @param workflowItem
         * @param type
         */
        self.addWorkflowItemFavorite = function (workflowItem, type) {
            return $http.post(urlService.favoritesDWF, generator.interceptSendInstance('Fav' + type, workflowItem))
                .then(function (result) {
                    return result.data.rs;
                });
        };
        /**
         * @description remove workflowItem from fav list.
         * @param workflowItem
         */
        self.removeWorkflowItemFavorite = function (workflowItem) {
            return $http
                .delete(urlService.favoritesDWF + '/' + workflowItem.relationId)
                .then(function (result) {
                    return result.data.rs;
                });
        };
        /**
         * @description remove bulk workflowItem from favorites.
         * @param workflowItems
         * @returns {*}
         */
        self.removeBulkWorkflowItemFromFavorites = function (workflowItems) {
            return $http({
                method: 'DELETE',
                url: urlService.favoritesDWF + '/bulk',
                data: _.map(workflowItems, 'relationId'),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (result) {
                _.map(workflowItems, function (item, index) {
                    workflowItems[index].setRelationId(null);
                });
                return workflowItems;
            });
        };
        /**
         * @description add workflowItems to favorites list.
         * @param workflowItems
         * @param type
         */
        self.addBulkWorkflowItemToFavorites = function (workflowItems, type) {
            var items = _mapBulkType(generator.interceptSendCollection('Fav' + type, workflowItems), type);
            return $http
                .post(urlService.favoritesDWF + '/' + (type === 'User' ? 'users' : 'ous') + '-bulk', items)
                .then(function (result) {
                    result = result.data.rs;
                    _.map(workflowItems, function (item, index) {
                        workflowItems[index].setRelationId(result[index]);
                    });
                    return workflowItems;
                });
        };

        /**
         * @description start launch distribution workflow.
         * @param distributionWF
         * @param correspondence
         * @param action
         */
        self.startLaunchWorkflow = function (distributionWF, correspondence, action) {
            if (angular.isArray(correspondence))
                return self.startLaunchWorkflowBulk(distributionWF, correspondence);
            var info = correspondence.getInfo(),
                workItemUrl = [urlService.correspondenceWF, info.documentClass, info.vsId, 'forward', info.wobNumber],
                correspondenceUrl = [urlService.correspondenceWF, info.documentClass, 'vsid', info.vsId];
            return $http
                .post(info.isWorkItem() && action !== 'launch' ? workItemUrl.join('/') : correspondenceUrl.join('/'), generator.interceptSendInstance('DistributionWF', distributionWF))
                .then(function (result) {
                    _emptyDistributionWFData();
                    return result.data.rs;
                })
                .catch(function (error) {
                    if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                        var info = self.correspondence.getInfo();
                        dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                        return $q.reject(false);
                    } else {
                        return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                    }
                })
        };
        /**
         * @description start launch distribution workflow bulk.
         * @param distributionWF
         * @param correspondences
         */
        self.startLaunchWorkflowBulk = function (distributionWF, correspondences) {
            var info = _.map(correspondences, function (item) {
                    return item.getInfo();
                }), workItem = info[0].isWorkItem(),
                workItemUrl = [urlService.correspondenceWF, 'forward', 'bulk'],
                correspondenceUrl = [urlService.correspondenceWF, 'bulk'],

                distBulk = (new DistributionBulk()).setDistributionBulk(correspondences, generator.interceptSendInstance('DistributionWF', distributionWF));
            return $http.post(workItem ? workItemUrl.join('/') : correspondenceUrl.join('/'), distBulk).then(function (result) {
                _emptyDistributionWFData();
                return result.data.rs;
            });
        };
        // tabs links
        self.tabsLinks = {
            users: {
                defaultReturn: [],
                onDemand: false
            },
            favorites: {
                defaultReturn: [],
                onDemand: false
            },
            private_users: {
                defaultReturn: [],
                onDemand: true,
                method: self.loadDistWorkflowUsers,
                name: 'privates',
                property: 'privateUsers'
            },
            manager_users: {
                defaultReturn: [],
                onDemand: true,
                method: self.loadDistWorkflowUsers,
                name: 'managers',
                property: 'managerUsers'
            },
            vice_manager_users: {
                defaultReturn: [],
                onDemand: true,
                method: self.loadDistWorkflowUsers,
                name: 'viceManagers',
                property: 'viceManagerUsers'
            },
            heads_of_government_entities: {
                defaultReturn: [],
                onDemand: true,
                method: self.loadDistWorkflowUsers,
                name: 'heads',
                property: 'governmentEntitiesHeads'
            },
            workflow_groups: {
                defaultReturn: [],
                onDemand: true,
                method: self.loadDistWorkflowGroups,
                name: null,
                property: 'workflowGroups'
            },
            organizational_unit_mail: {
                defaultReturn: [],
                onDemand: true,
                method: self.loadDistWorkflowOrganizations,
                name: 'organizations',
                property: 'organizationGroups'
            },
            registry_organizations: {
                defaultReturn: [],
                onDemand: true,
                method: self.loadDistWorkflowOrganizations,
                name: 'registry',
                property: 'registryOrganizations'
            }
        };
        /**
         * @description load content for given tab.
         * @param tab
         */
        self.loadTabContent = function (tab) {
            if (!self.tabsLinks[tab].onDemand)
                return $timeout(function () {
                    return {
                        onDemand: false,
                        data: null
                    }
                });

            return self
                .tabsLinks[tab]
                .method(self.tabsLinks[tab].name)
                .then(function (result) {
                    return {
                        onDemand: true,
                        property: self.tabsLinks[tab].property,
                        data: result
                    }
                });
        };


        self.openEscalationUserDialog = function (distWorkflowItem, $event, organizationGroups) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('select-escalation-user'),
                controller: 'selectEscalationUserPopCtrl',
                controllerAs: 'ctrl',
                bindToController: true,
                targetEvent: $event,
                locals: {
                    escalationUserId: distWorkflowItem.escalationUserId,
                    organizationGroups: organizationGroups
                }
            })
        };


        /**
         *@description load ministry assistants
         */
        self.loadMinisterAssistants = function () {
            return $http.get(urlService.ministerAssistant).then(function (result) {
                return generator.interceptReceivedCollection('MinistryAssistant', generator.generateCollection(result.data.rs, MinistryAssistant))
            }).catch(function (e) {
                return [];
            });
        }

        /**
         *@description add ministry assistant
         */
        self.addMinistryAssistant = function (organization, user) {
            return $http.post(urlService.ministerAssistant, {
                "userId": user.hasOwnProperty('id') ? user.id : user,
                "ouId": organization.hasOwnProperty('id') ? organization.id : organization
            }).then(function (result) {
                return true;
            });
        }

        /**
         * @description remove workflowItem from fav list.
         * @param assistant
         */
        self.removeMinistryAssistant = function (assistant) {
            return $http
                .delete(urlService.ministerAssistant + '/' + assistant.id)
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description load added from global setting the minister assistants
         * @returns {*}
         */
        self.loadSelectedMinisterAssistants = function () {
            return $http.get(urlService.distributionWF + '/ministry-assistants').then(function (result) {
                return generator.generateCollection(result.data.rs, WFUser);
            }).catch(function (e) {
                return [];
            });
        }


        /**
         * @description load ous and action and user comments
         * @returns {*}
         */
        self.loadOrganizationsActionsComments = function () {
            //organizationGroups + comments + workflowActions
            return $http.get(urlService.distributionWF + '/quick-send').then(function (result) {
                return {
                    organizationGroups: generator.generateCollection(result.data.rs.ouList, WFOrganization),
                    workflowActions: generator.interceptReceivedCollection('WorkflowAction', generator.generateCollection(result.data.rs.workFlowActionList, WorkflowAction, self._sharedMethods)),
                    comments: generator.interceptReceivedCollection('UserComment', generator.generateCollection(result.data.rs.userCommentList, UserComment, self._sharedMethods))
                }
            });
        }
    });
};
