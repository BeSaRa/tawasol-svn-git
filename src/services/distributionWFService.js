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
                url: 'UsersList',
                model: WFUser,
                property: 'favoriteUsers'
            },
            organizations: {
                url: 'OUsList',
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
            }
        };

        self.organizationsMap = {
            registry: {
                url: urlService.distributionWFREGOrganization,
                property: 'registryOrganizations'
            },
            organizations: {
                url: urlService.distributionWFOrganization,
                property: 'organizationGroups'
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
                return self[self.organizationsMap[name].property] = generator.generateCollection(result.data.rs, WFOrganization);
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
                return self.workflowGroups = generator.interceptReceivedCollection('WFGroup', _.map(result.data.rs, 'wfgroup'));
            })
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
         */
        self.searchUsersByCriteria = function (searchCriteria) {
            return $http.post(urlService.distributionWF + '/search', generator.interceptSendInstance('UserSearchCriteria', searchCriteria))
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
                .post(urlService.favoritesDWF + '/bulk' + (type === 'User' ? 'Users' : 'OUs'), items)
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
         */
        self.startLaunchWorkflow = function (distributionWF, correspondence) {
            if (angular.isArray(correspondence))
                return self.startLaunchWorkflowBulk(distributionWF, correspondence);
            var info = correspondence.getInfo(),
                workItemUrl = [urlService.correspondenceWF, info.documentClass, info.vsId, 'forward', info.wobNumber],
                correspondenceUrl = [urlService.correspondenceWF, info.documentClass, 'vsid', info.vsId];
            return $http
                .post(info.isWorkItem() ? workItemUrl.join('/') : correspondenceUrl.join('/'), generator.interceptSendInstance('DistributionWF', distributionWF))
                .then(function (result) {
                    _emptyDistributionWFData();
                    return result.data.rs;
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


    });
};
