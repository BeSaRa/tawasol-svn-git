module.exports = function (app) {
    app.service('entityService', function (urlService,
                                           $http,
                                           $q,
                                           generator,
                                           Entity,
                                           _,
                                           dialog,
                                           langService,
                                           toast,
                                           cmsTemplate,
                                           LDAPProvider) {
        'ngInject';
        var self = this;
        self.serviceName = 'entityService';

        self.entities = [];

        /**
         * @description Load the entities from server.
         * @returns {Promise|entities}
         */
        self.loadEntities = function () {
            return $http.get(urlService.entities).then(function (result) {
                self.entities = generator.generateCollection(result.data.rs, Entity, self._sharedMethods);
                self.entities = generator.interceptReceivedCollection('Entity', self.entities);
                return self.entities;
            });
        };

        /**
         * @description Get entities from self.entities if found and if not load it from server again.
         * @returns {Promise|entities}
         */
        self.getEntities = function () {
            return self.entities.length ? $q.when(self.entities) : self.loadEntities();
        };

        /**
         * @description Contains methods for CRUD operations for entities
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new entities
             * @param $event
             */
            entityAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('entity'),
                        controller: 'entityPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            entity: new Entity(),
                            entities: self.entities
                        }
                    });
            },
            /**
             * @description Opens popup to edit entities
             * @param entity
             * @param $event
             */
            entityEdit: function (entity, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('entity'),
                        controller: 'entityPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            entity: entity,
                            entities: self.entities
                        }
                    });
            },
            /**
             * @description Show confirm box and delete entities
             * @param entity
             * @param $event
             */
            entityDelete: function (entity, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: entity.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteEntity(entity).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: entity.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk entities
             * @param entities
             * @param $event
             */
            entityDeleteBulk: function (entities, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkEntities(entities)
                            .then(function (result) {
                                var response = false;
                                if (result.length === entities.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (entity) {
                                        return entity.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },
            /**
             * @description Opens popup to add new ldap provider
             * @param $event
             */
            ldapAddDialog: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event || null,
                        templateUrl: cmsTemplate.getPopup('ldap-provider'),
                        controller: 'ldapProviderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            ldapProvider: new LDAPProvider()
                        }
                    });
            },
            /**
             * @description Opens popup to edit ldap provider
             * @param provider
             * @param $event
             */
            ldapEditDialog: function (provider, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event || null,
                        templateUrl: cmsTemplate.getPopup('ldap-provider'),
                        controller: 'ldapProviderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            ldapProvider: angular.copy(provider)
                        }
                    });
            }
        };

        /**
         * @description Add new entities
         * @param entity
         * @return {Promise|Entity}
         */
        self.addEntity = function (entity) {
            return $http
                .post(urlService.entities,
                    generator.interceptSendInstance('Entity', entity))
                .then(function (result) {
                    return generator.interceptReceivedInstance('Entity', generator.generateInstance(result.data.rs, Entity, self._sharedMethods));
                })
                .catch(function (error) {
                    return $q.reject(false);
                });
        };

        /**
         * @description Update the given entities.
         * @param entity
         * @return {Promise|Entity}
         */
        self.updateEntity = function (entity) {
            return $http
                .put(urlService.entities,
                    generator.interceptSendInstance('Entity', entity))
                .then(function () {
                    return entity;
                })
                .catch(function (error) {
                    return $q.reject(false);
                });
        };

        /**
         * @description Delete given entities.
         * @param entity
         * @return {Promise|null}
         */
        self.deleteEntity = function (entity) {
            var id = entity.hasOwnProperty('id') ? entity.id : entity;
            return $http.delete((urlService.entities + '/' + id));
        };

        /**
         * @description Delete bulk entities.
         * @param entities
         * @return {Promise|null}
         */
        self.deleteBulkEntities = function (entities) {
            var bulkIds = entities[0].hasOwnProperty('id') ? _.map(entities, 'id') : entities;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.entities + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedEntities = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedEntities.push(key);
                });
                return _.filter(entities, function (entity) {
                    return (failedEntities.indexOf(entity.id) > -1);
                });
            });
        };

        /**
         * @description Get entities by entityId
         * @param entityId
         * @returns {Entity|undefined} return Entity Model or undefined if not found.
         */
        self.getEntityById = function (entityId) {
            entityId = entityId.hasOwnProperty('id') ? entityId.id : entityId;
            return _.find(self.entities, function (entity) {
                return Number(entity.id) === Number(entityId);
            });
        };

        self.loadEntityById = function (entityId) {
            entityId = entityId.hasOwnProperty('id') ? entityId.id : entityId;
            return self.entities.length ? $.when(self.getEntityById(entityId)) : self.loadEntities().then(function (value) {
                return self.loadEntityById(entityId);
            });
        };

        /**
         * @description Activate entities
         * @param entity
         */
        self.activateEntity = function (entity) {
            return $http
                .put((urlService.entities + '/activate/' + entity.id))
                .then(function () {
                    return entity;
                });
        };

        /**
         * @description Deactivate entities
         * @param entity
         */
        self.deactivateEntity = function (entity) {
            return $http
                .put((urlService.entities + '/deactivate/' + entity.id))
                .then(function () {
                    return entity;
                });
        };

        /**
         * @description Activate bulk of entities
         * @param entities
         */
        self.activateBulkEntities = function (entities) {
            var bulkIds = entities[0].hasOwnProperty('id') ? _.map(entities, 'id') : entities;
            return $http
                .put((urlService.entities + '/activate/bulk'), bulkIds)
                .then(function () {
                    return entities;
                });
        };

        /**
         * @description Deactivate bulk of entities
         * @param entities
         */
        self.deactivateBulkEntities = function (entities) {
            var bulkIds = entities[0].hasOwnProperty('id') ? _.map(entities, 'id') : entities;
            return $http
                .put((urlService.entities + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return entities;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param entity
         * @param field
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateEntity = function (entity, field, editMode) {
            var entitiesToFilter = self.entities;
            if (editMode) {
                entitiesToFilter = _.filter(entitiesToFilter, function (entityToFilter) {
                    return entityToFilter.id !== entity.id;
                });
            }
            return _.some(_.map(entitiesToFilter, function (existingEntity) {
                if (field.toLowerCase() === "name") {
                    return existingEntity.arName === entity.arName
                        || existingEntity.enName.toLowerCase() === entity.enName.toLowerCase();
                }
                else if (field.toLowerCase() === "identifier") {
                    return existingEntity.identifier.toLowerCase() === entity.identifier.toLowerCase();
                }
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteEntity, self.updateEntity);

        /**
         * @description test LDAP connection
         */
        self.ldapConnectionTest = function (provider) {
            var ldapConnection = {
                'serverAddress': provider.serverAddress,
                'dc': provider.dc,
                'userName': provider.userName,
                'password': provider.password,
                'tawasolOU': provider.tawasolOU
            };
            return $http
                .post((urlService.connectionTest + '/' + 'ldap'), ldapConnection)
                .then(function (result) {
                    return result.data.rs;
                });
        };
        /**
         * @description test file net connection
         */
        self.fileNetConnectionTest = function (entity) {
            var fileNetConnection = {
                'cmUserName': entity.cmUserName,
                'cmPassword': entity.cmPassword,
                'cmEJBaddress': entity.cmEJBaddress,
                'cmStanza': entity.cmStanza,
                'osName': entity.osName,
                'peRouterName': entity.peRouterName
            };
            return $http
                .post((urlService.connectionTest + '/' + 'filenet'), fileNetConnection)
                .then(function (result) {
                    return result.data.rs;
                });
        };
        /**
         * @description test SMTP connection
         */
        self.smtpConnectionTest = function (entity) {
            var smtpConnection = {
                'smtpServerAddress': entity.smtpServerAddress,
                'smtpUserName': entity.smtpUserName,
                'smtpPassword': entity.smtpPassword,
                'smtpFromEmail': entity.smtpFromEmail,
                'smtpSubject': entity.smtpSubject,
                'smtpPort': entity.smtpPort
            };
            return $http
                .post((urlService.connectionTest + '/' + 'smtp'), smtpConnection)
                .then(function (result) {
                    return result.data.rs;
                });
        };
    });
};
