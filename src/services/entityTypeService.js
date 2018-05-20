module.exports = function (app) {
    app.service('entityTypeService', function (urlService,
                                               $http,
                                               $q,
                                               generator,
                                               EntityType,
                                               _,
                                               dialog,
                                               langService,
                                               toast,
                                               cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'entityTypeService';

        self.entityTypes = [];
        // the default value for any entities, indexing important!.
        var defaultValues = ['EMPLOYEE', 'EXTERNAL_USER', 'COMPANY'];

        /**
         * @description load entity types from server.
         * @returns {Promise|entityTypes}
         */
        self.loadEntityTypes = function () {
            return $http.get(urlService.entityTypes).then(function (result) {
                self.entityTypes = generator.generateCollection(result.data.rs, EntityType, self._sharedMethods);
                self.entityTypes = generator.interceptReceivedCollection('EntityType', self.entityTypes);
                return self.entityTypes;
            });
        };
        /**
         * @description get entity types from self.entityTypes if found and if not load it from server again.
         * @returns {Promise|entityTypes}
         */
        self.getEntityTypes = function () {
            return self.entityTypes.length ? $q.when(self.entityTypes) : self.loadEntityTypes();
        };

        /**
         * @description Contains methods for CRUD operations for entity types
         */
        self.controllerMethod = {
            entityTypeAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('entity-type'),
                        controller: 'entityTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            entityType: new EntityType(
                                {
                                    itemOrder: generator.createNewID(self.entityTypes, 'itemOrder')
                                }),
                            entityTypes: self.entityTypes
                        }
                    });
            },
            entityTypeEdit: function (entityType, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('entity-type'),
                        controller: 'entityTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            entityType: angular.copy(entityType)
                        }
                    });
            },
            entityTypeDelete: function (entityType, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: entityType.getNames()}))
                    .then(function () {
                        return self.deleteEntityType(entityType).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: entityType.getNames()}));
                            return true;
                        })
                    });
            },
            entityTypeDeleteBulk: function (entityTypes, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function (result) {
                        return self.deleteBulkEntityTypes(entityTypes).then(function (result) {
                            var response = false;
                            if (result.length === entityTypes.length) {
                                toast.error(langService.get("failed_delete_selected"));
                                response = false;
                            }
                            else if (result.length) {
                                generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (entityType) {
                                    return entityType.getNames();
                                }));
                                response = true;
                            }
                            else {
                                toast.success(langService.get("delete_success"));
                                response = true;
                            }
                            return response;
                        });
                    });
            }
        };

        /**
         * @description add new entity type
         * @param entityType
         * @return {Promise|EntityType}
         */
        self.addEntityType = function (entityType) {
            return $http
                .post(urlService.entityTypes,
                    generator.interceptSendInstance('EntityType', entityType))
                .then(function (result) {
                    return generator.interceptReceivedInstance('EntityType', generator.generateInstance(entityType, EntityType, self._sharedMethods));
                });
        };
        /**
         * @description make an update for given entity type.
         * @param entityType
         * @return {Promise|EntityType}
         */
        self.updateEntityType = function (entityType) {
            return $http
                .put(urlService.entityTypes,
                    generator.interceptSendInstance('EntityType', entityType))
                .then(function () {
                    return generator.interceptReceivedInstance('EntityType', generator.generateInstance(entityType, EntityType, self._sharedMethods));
                });
        };
        /**
         * @description delete given entity type.
         * @param entityType
         * @return {Promise|null}
         */
        self.deleteEntityType = function (entityType) {
            var id = entityType.hasOwnProperty('id') ? entityType.id : entityType;
            return $http.delete(urlService.entityTypes + '/' + id).then(function (result) {
                return result;
            });
        };

        /**
         * @description delete bulk entity types.
         * @param entityTypes
         * @return {Promise|null}
         */
        self.deleteBulkEntityTypes = function (entityTypes) {
            var bulkIds = entityTypes[0].hasOwnProperty('id') ? _.map(entityTypes, 'id') : entityTypes;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.entityTypes + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedEntityTypes = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedEntityTypes.push(key);
                });
                return _.filter(entityTypes, function (entityType) {
                    return (failedEntityTypes.indexOf(entityType.id) > -1);
                });
            });
        };

        /**
         * @description get entity type by entityTypeId
         * @param entityTypeId
         * @returns {EntityType|undefined} return EntityType Model or undefined if not found.
         */
        self.getEntityTypeById = function (entityTypeId) {
            entityTypeId = entityTypeId.hasOwnProperty('id') ? entityTypeId.id : entityTypeId;
            return _.find(self.entityTypes, function (entityType) {
                return Number(entityType.id) === Number(entityTypeId)
            });
        };


        /**
         * @description activate entity type
         * @param entityType
         */
        self.activateEntityType = function (entityType) {
            return $http
                .put((urlService.entityTypes + '/activate/' + entityType.id))
                .then(function () {
                    return entityType;
                });
        };

        /**
         * @description Deactivate entity type
         * @param entityType
         */
        self.deactivateEntityType = function (entityType) {
            return $http
                .put((urlService.entityTypes + '/deactivate/' + entityType.id))
                .then(function () {
                    return entityType;
                });
        };

        /**
         * @description Activate bulk of entity types
         * @param entityTypes
         */
        self.activateBulkEntityTypes = function (entityTypes) {
            return $http
                .put((urlService.entityTypes + '/activate/bulk'), _.map(entityTypes, 'id'))
                .then(function () {
                    return entityTypes;
                });
        };

        /**
         * @description Deactivate bulk of entity types
         * @param entityTypes
         */
        self.deactivateBulkEntityTypes = function (entityTypes) {
            return $http
                .put((urlService.entityTypes + '/deactivate/bulk'), _.map(entityTypes, 'id'))
                .then(function () {
                    return entityTypes;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param entityType
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateEntityType = function (entityType, editMode) {
            var entityTypesToFilter = self.entityTypes;
            if (editMode) {
                entityTypesToFilter = _.filter(entityTypesToFilter, function (entityTypeToFilter) {
                    return entityTypeToFilter.id !== entityType.id;
                });
            }
            return _.some(_.map(entityTypesToFilter, function (existingEntityType) {
                return existingEntityType.arName === entityType.arName
                    || existingEntityType.enName.toLowerCase() === entityType.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteEntityType, self.updateEntityType);
        /**
         * default entity types
         */
        self.getDefaultEntityTypes = function () {
            var result = {};
            for (var i = 0; i < self.entityTypes.length; i++) {
                var index = defaultValues.indexOf(self.entityTypes[i].lookupStrKey);
                if (index !== -1) {
                    result[index] = self.entityTypes[i];
                }
            }
            return Object.values(result);
        };
        /**
         * @description get entity Type by index From default Values
         * @param index
         * @param lookups
         * @returns {*}
         */
        self.getEntityTypeByIndex = function (index, lookups) {
            return self.getEntityTypeByLookupString(defaultValues[index], lookups);
        };
        /**
         * @description get entity byLookupStringKey
         * @param string
         * @param lookups
         */
        self.getEntityTypeByLookupString = function (string, lookups) {
            string = string && string.hasOwnProperty('id') ? string.lookupStrKey : string;
            if (!string)
                return null;

            return _.find(lookups || self.entityTypes, function (item) {
                return (item.lookupStrKey + "").toLowerCase() === string.toLowerCase();
            });
        };
        /**
         * @description get entity type by lookup Key.
         * @param lookupKey
         * @param lookups
         */
        self.getEntityTypeByLookupKey = function (lookupKey, lookups) {
            return _.find(lookups || self.entityTypes, function (item) {
                return Number(item.lookupKey) === Number(lookupKey);
            });
        };
        /**
         * @description used for linkedObject inside interceptor
         * @param type
         * @param lookups
         * @returns {EntityType}
         */
        self.getLinkedType = function (type, lookups) {
            type = type.hasOwnProperty('id') ? type.lookupKey : type;
            return type > 2 ? self.getEntityTypeByLookupKey(type, lookups) : self.getEntityTypeByIndex(type, lookups);
        };
        /**
         * @description set linked type used in linkedObject interceptor.
         * @param type
         * @returns {number}
         */
        self.setLinkedType = function (type) {
            if (!type.lookupStrKey)
                debugger;
            var position = defaultValues.indexOf(type.lookupStrKey);
            return position !== -1 ? position : type.lookupKey;
        };
        /**
         * custom entity types
         * @return {Array}
         */
        self.getCustomEntityTypes = function () {
            var ids = _.map(self.getDefaultEntityTypes(), 'id');
            return _.filter(self.entityTypes, function (item) {
                return ids.indexOf(item.id) === -1;
            });
        };

    });
};
