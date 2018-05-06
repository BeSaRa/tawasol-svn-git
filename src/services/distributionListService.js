module.exports = function (app) {
    app.service('distributionListService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     DistributionList,
                                                     _,
                                                     dialog,
                                                     langService,
                                                     toast,
                                                     cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'distributionListService';

        self.distributionLists = [];

        /**
         * @description Load the distribution Lists from server.
         * @returns {Promise|distributionLists}
         */
        self.loadDistributionLists = function () {
            return $http.get(urlService.distributionLists).then(function (result) {
                self.distributionLists = generator.generateCollection(result.data.rs, DistributionList, self._sharedMethods);
                self.distributionLists = generator.interceptReceivedCollection('DistributionList', self.distributionLists);
                return self.distributionLists;
            });
        };

        /**
         * @description Get distribution Lists from self.distributionLists if found and if not load it from server again.
         * @returns {Promise|distributionLists}
         */
        self.getDistributionLists = function () {
            return self.distributionLists.length ? $q.when(self.distributionLists) : self.loadDistributionLists();
        };

        /**
         * @description Contains methods for CRUD operations for distribution Lists
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new distribution List
             * @param organizations
             * @param $event
             */
            distributionListAdd: function (organizations, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('distribution-list'),
                        controller: 'distributionListPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            distributionList: new DistributionList(),
                            distributionLists: self.distributionLists,
                            organizations: organizations
                        }
                    });
            },
            /**
             * @description Opens popup to edit distribution List
             * @param distributionList
             * @param organizations
             * @param $event
             */
            distributionListEdit: function (distributionList, organizations, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('distribution-list'),
                        controller: 'distributionListPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            distributionList: distributionList,
                            distributionLists: self.distributionLists,
                            organizations: organizations
                        }
                    });
            },
            /**
             * @description Show confirm box and delete distribution List
             * @param distributionList
             * @param $event
             */
            distributionListDelete: function (distributionList, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: distributionList.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteDistributionList(distributionList).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: distributionList.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk distribution Lists
             * @param distributionLists
             * @param $event
             */
            distributionListDeleteBulk: function (distributionLists, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkDistributionLists(distributionLists)
                            .then(function (result) {
                                var response = false;
                                if (result.length === distributionLists.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (distributionList) {
                                        return distributionList.getNames();
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
         * @description Add new distribution List
         * @param distributionList
         * @return {Promise|DistributionList}
         */
        self.addDistributionList = function (distributionList) {
            return $http
                .post(urlService.distributionLists,
                    generator.interceptSendInstance('DistributionList', distributionList))
                .then(function (result) {
                    distributionList.id = result.data.rs;
                    return distributionList;
                    //return generator.interceptReceivedInstance('DistributionList', generator.generateInstance(distributionList, DistributionList, self._sharedMethods));
                });
        };

        /**
         * @description Update the given distribution List.
         * @param distributionList
         * @return {Promise|DistributionList}
         */
        self.updateDistributionList = function (distributionList) {
            return $http
                .put(urlService.distributionLists,
                    generator.interceptSendInstance('DistributionList', distributionList))
                .then(function () {
                    return generator.interceptReceivedInstance('DistributionList', generator.generateInstance(distributionList, DistributionList, self._sharedMethods));
                });
        };

        /**
         * @description Delete given distribution List.
         * @param distributionList
         * @return {Promise|null}
         */
        self.deleteDistributionList = function (distributionList) {
            var id = distributionList.hasOwnProperty('id') ? distributionList.id : distributionList;
            return $http.delete((urlService.distributionLists + '/' + id)).then(function (result) {
                return result;
            });
        };

        /**
         * @description Delete bulk distribution Lists.
         * @param distributionLists
         * @return {Promise|null}
         */
        self.deleteBulkDistributionLists = function (distributionLists) {
            var bulkIds = distributionLists[0].hasOwnProperty('id') ? _.map(distributionLists, 'id') : distributionLists;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.distributionLists + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedDistributionLists = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDistributionLists.push(key);
                });
                return _.filter(distributionLists, function (distributionList) {
                    return (failedDistributionLists.indexOf(distributionList.id) > -1);
                });
            });
        };

        /**
         * @description Get distribution List by distributionListId
         * @param distributionListId
         * @returns {DistributionList|undefined} return DistributionList Model or undefined if not found.
         */
        self.getDistributionListById = function (distributionListId) {
            distributionListId = distributionListId instanceof DistributionList ? distributionListId.id : distributionListId;
            return _.find(self.distributionLists, function (distributionList) {
                return Number(distributionList.id) === Number(distributionListId)
            });
        };

        /**
         * @description Activate distribution List
         * @param distributionList
         */
        self.activateDistributionList = function (distributionList) {
            return $http
                .put((urlService.distributionLists + '/activate/' + distributionList.id))
                .then(function () {
                    return distributionList;
                });
        };

        /**
         * @description Deactivate distribution List
         * @param distributionList
         */
        self.deactivateDistributionList = function (distributionList) {
            return $http
                .put((urlService.distributionLists + '/deactivate/' + distributionList.id))
                .then(function () {
                    return distributionList;
                });
        };

        /**
         * @description Activate bulk of distribution Lists
         * @param distributionLists
         */
        self.activateBulkDistributionLists = function (distributionLists) {
            var bulkIds = distributionLists[0].hasOwnProperty('id') ? _.map(distributionLists, 'id') : distributionLists;
            return $http
                .put((urlService.distributionLists + '/activate/bulk'), bulkIds)
                .then(function () {
                    return distributionLists;
                });
        };

        /**
         * @description Deactivate bulk of distribution Lists
         * @param distributionLists
         */
        self.deactivateBulkDistributionLists = function (distributionLists) {
            var bulkIds = distributionLists[0].hasOwnProperty('id') ? _.map(distributionLists, 'id') : distributionLists;
            return $http
                .put((urlService.distributionLists + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return distributionLists;
                });
        };

        /* /!**
         * @description Set the globalization of distribution List
         * @param distributionList
         *!/
         self.globalizeDistributionList = function (distributionList) {
         return $http
         .put(urlService.distributionLists, distributionList)
         .then(function () {
         return distributionList;
         });
         };*/

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param distributionList
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDistributionList = function (distributionList, editMode) {
            var distributionListsToFilter = self.distributionLists;
            if (editMode) {
                distributionListsToFilter = _.filter(distributionListsToFilter, function (distributionListToFilter) {
                    return distributionListToFilter.id !== distributionList.id;
                });
            }
            return _.some(_.map(distributionListsToFilter, function (existingDistributionList) {
                return existingDistributionList.arName === distributionList.arName
                    || existingDistributionList.enName.toLowerCase() === distributionList.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDistributionList, self.updateDistributionList);
    });
};
