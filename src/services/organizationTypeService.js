module.exports = function (app) {
    app.service('organizationTypeService', function (urlService,
                                                     $http,
                                                     $q,
                                                     dialog,
                                                     generator,
                                                     toast,
                                                     langService,
                                                     cmsTemplate,
                                                     OrganizationType,
                                                     _) {
        'ngInject';
        var self = this;
        self.serviceName = 'organizationTypeService';

        self.organizationTypes = [];

        /**
         * @description Load the organization types from server.
         * @returns {Promise|organizationTypes}
         */
        self.loadOrganizationTypes = function () {
            return $http.get(urlService.organizationTypes).then(function (result) {
                self.organizationTypes = generator.generateCollection(result.data.rs, OrganizationType, self._sharedMethods);
                self.organizationTypes = generator.interceptReceivedCollection('OrganizationType', self.organizationTypes);
                return self.organizationTypes;
            });
        };

        /**
         * @description Get organization types from self.organizationTypes if found and if not load it from server again.
         * @returns {Promise|organizationTypes}
         */
        self.getOrganizationTypes = function () {
            return self.organizationTypes.length ? $q.when(self.organizationTypes) : self.loadOrganizationTypes();
        };

        /**
         * @description Contains methods for CRUD operations for organization types
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new organization type
             * @param $event
             */
            organizationTypeAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('organization-type'),
                        controller: 'organizationTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            organizationType: new OrganizationType(
                                {
                                    itemOrder: generator.createNewID(self.organizationTypes, 'itemOrder')
                                }),
                            organizationTypes: self.organizationTypes
                        }
                    });
            },
            /**
             * @description Opens popup to edit organization type
             * @param organizationType
             * @param $event
             */
            organizationTypeEdit: function (organizationType, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('organization-type'),
                        controller: 'organizationTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            organizationType: organizationType,
                            organizationTypes: self.organizationTypes
                        }
                    });
            },
            /**
             * @description Show confirm box and delete organization type
             * @param organizationType
             * @param $event
             */
            organizationTypeDelete: function (organizationType, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: organizationType.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteOrganizationType(organizationType)
                            .then(function () {
                                toast.success(langService.get('delete_specific_success').change({name: organizationType.getNames()}));
                                return true;
                            });
                    });
            },
            /**
             * @description Show confirm box and delete bulk organization types
             * @param organizationTypes
             * @param $event
             */
            organizationTypeDeleteBulk: function (organizationTypes, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkOrganizationTypes(organizationTypes)
                            .then(function (result) {
                                var response = false;
                                if (result.length === organizationTypes.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (organizationType) {
                                        return organizationType.getNames();
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
         * @description Add new organization type to service
         * @param organizationType
         * @return {Promise|OrganizationType}
         */
        self.addOrganizationType = function (organizationType) {
            return $http
                .post(urlService.organizationTypes,
                    generator.interceptSendInstance('OrganizationType', organizationType))
                .then(function () {
                    return organizationType;
                });
        };

        /**
         * @description Update the given organization type.
         * @param organizationType
         * @return {Promise|OrganizationType}
         */
        self.updateOrganizationType = function (organizationType) {
            return $http.put(urlService.organizationTypes,
                generator.interceptSendInstance('OrganizationType', organizationType))
                .then(function () {
                    return organizationType;
                });
        };
        /**
         * @description Delete given organization type.
         * @param organizationType
         * @return {Promise}
         */
        self.deleteOrganizationType = function (organizationType) {
            var id = organizationType.hasOwnProperty('id') ? organizationType.id : organizationType;
            return $http.delete((urlService.organizationTypes + '/' + organizationType.id));
        };

        /**
         * @description Delete bulk organization types.
         * @param organizationTypes
         * @return {Promise|null}
         */
        self.deleteBulkOrganizationTypes = function (organizationTypes) {
            var bulkIds = organizationTypes[0].hasOwnProperty('id') ? _.map(organizationTypes, 'id') : organizationTypes;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.organizationTypes + '/' + 'bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedOrganizationTypes = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedOrganizationTypes.push(key);
                });
                return _.filter(organizationTypes, function (organizationType) {
                    return (failedOrganizationTypes.indexOf(organizationType.id) > -1);
                });
            });
        };

        /**
         * @description Get organization type by organizationTypeId
         * @param organizationTypeId
         * @returns {OrganizationType|undefined} return OrganizationType Model or undefined if not found.
         */
        self.getOrganizationTypeById = function (organizationTypeId) {
            organizationTypeId = organizationTypeId.hasOwnProperty('id') ? organizationTypeId.id : organizationTypeId;
            return _.find(self.organizationTypes, function (organizationType) {
                return Number(organizationType.id) === Number(organizationTypeId)
            });
        };
        /**
         * @description Get organization type by lookupKey
         * @param lookupKey
         * @returns {OrganizationType|undefined} return OrganizationType Model or undefined if not found.
         */
        self.getOrganizationTypeByLookupKey = function (lookupKey) {
            lookupKey = lookupKey && lookupKey.hasOwnProperty('id') ? lookupKey.lookupKey : lookupKey;
            return _.find(self.organizationTypes, function (item) {
                return Number(lookupKey) === Number(item.lookupKey);
            }) || lookupKey;
        };

        /**
         * @description Activate organization type
         * @param organizationType
         */
        self.activateOrganizationType = function (organizationType) {
            return $http
                .put((urlService.organizationTypes + '/activate/' + organizationType.id))
                .then(function () {
                    return organizationType;
                });
        };

        /**
         * @description Deactivate organization type
         * @param organizationType
         */
        self.deactivateOrganizationType = function (organizationType) {
            return $http
                .put((urlService.organizationTypes + '/deactivate/' + organizationType.id))
                .then(function () {
                    return organizationType;
                });
        };

        /**
         * @description Activate bulk organization types
         * @param organizationTypes
         */
        self.activateBulkOrganizationTypes = function (organizationTypes) {
            var bulkIds = organizationTypes[0].hasOwnProperty('id') ? _.map(organizationTypes, 'id') : organizationTypes;
            return $http
                .put((urlService.organizationTypes + '/activate/bulk'), bulkIds)
                .then(function () {
                    return organizationTypes;
                });
        };

        /**
         * @description Deactivate bulk organization types
         * @param organizationTypes
         */
        self.deactivateBulkOrganizationTypes = function (organizationTypes) {
            var bulkIds = organizationTypes[0].hasOwnProperty('id') ? _.map(organizationTypes, 'id') : organizationTypes;
            return $http
                .put((urlService.organizationTypes + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return organizationTypes;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param organizationType
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateOrganizationType = function (organizationType, editMode) {
            var organizationTypesToFilter = self.organizationTypes;
            if (editMode) {
                organizationTypesToFilter = _.filter(organizationTypesToFilter, function (organizationTypeToFilter) {
                    return organizationTypeToFilter.id !== organizationType.id;
                });
            }
            return _.some(_.map(organizationTypesToFilter, function (existingOrganizationType) {
                return existingOrganizationType.arName === organizationType.arName
                    || existingOrganizationType.enName.toLowerCase() === organizationType.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteOrganizationType, self.updateOrganizationType);

    });
};
