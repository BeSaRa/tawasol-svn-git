module.exports = function (app) {
    app.service('distributionWFService', function (urlService, WFUser, WFOrganization, WFGroup, $timeout, $http, $q, generator, _) {
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

        self.organizationalUnits = [];

        self.workflowGroups = [];


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
                url: null,
                property: 'registryOrganizations'
            },
            organizations: {
                url: null,
                property: 'organizationalUnits'
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
         * @description load dist
         * @param name
         */
        self.loadDistWorkflowOrganizations = function (name) {
            return $http.get(self.organizationsMap[name].url).then(function (result) {
                return self[self.organizationsMap[name].property] = generator.generateCollection(result.data.rs, WFOrganization);
            });
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
            return $http.get(urlService.favoritesDWF + '/' + self.favoriteUrlMap[favoritesName].url)
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
            return $http.post(urlService.distributionWF + '/search', searchCriteria)
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
                }), workItem = info[0].isWorkItem(), documentClass = info[0].documentClass,
                workItemUrl = [urlService.correspondenceWF, documentClass, 'forward', 'bulk'],
                correspondenceUrl = [urlService.correspondenceWF, documentClass, 'bulk'];

            return $http.post(workItem ? workItemUrl.join('/') : correspondenceUrl.join('/'), {
                first: _.map(info, function (item) {
                    return workItem ? {first: item.vsId, second: item.wobNumber} : item.vsId;
                }),
                second: generator.interceptSendInstance('DistributionWF', distributionWF)
            }).then(function (result) {
                return result.data.rs;
            })
        }

    });
};
