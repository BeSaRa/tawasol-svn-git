module.exports = function (app) {
    app.service('propertyConfigurationService', function (urlService,
                                                          $http,
                                                          $q,
                                                          generator,
                                                          PropertyConfiguration,
                                                          _,
                                                          dialog,
                                                          langService,
                                                          toast,
                                                          cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'propertyConfigurationService';

        self.propertyConfigurations = [];

        /**
         * @description Load the property configurations from server.
         * @returns {Promise|propertyConfigurations}
         */
        self.loadPropertyConfigurations = function () {
            return $http.get(urlService.propertyConfigurations).then(function (result) {
                self.propertyConfigurations = generator.generateCollection(result.data.rs, PropertyConfiguration, self._sharedMethods);
                self.propertyConfigurations = generator.interceptReceivedCollection('PropertyConfiguration', self.propertyConfigurations);
                return self.propertyConfigurations;
            });
        };
        /**
         * @description load propertyConfiguration by documentClass and ouId.
         * @param documentClass
         * @param ouId
         */
        self.loadPropertyConfigurationsByDocumentClassAndOU = function (documentClass, ouId) {
            ouId = ouId.hasOwnProperty('id') ? ouId.id : ouId;
            return $http.get(urlService.propertyConfigurations + '/ou/' + ouId + '/' + documentClass).then(function (result) {
                var collection = generator.generateCollection(result.data.rs, PropertyConfiguration, self._sharedMethods);
                return generator.interceptReceivedCollection('PropertyConfiguration', collection);
            });
        };

        /**
         * @description Get property configurations from self.propertyConfigurations if found and if not load it from server again.
         * @returns {Promise|propertyConfigurations}
         */
        self.getPropertyConfigurations = function () {
            return self.propertyConfigurations.length ? $q.when(self.propertyConfigurations) : self.loadPropertyConfigurations();
        };

        /**
         * @description Contains methods for CRUD operations for property configurations
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new property configuration
             * @param ouId
             * @param selectedDocumentClass
             * @param $event
             */
            propertyConfigurationAdd: function (ouId, selectedDocumentClass, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('property-configuration'),
                        controller: 'propertyConfigurationPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            propertyConfiguration: new PropertyConfiguration({
                                ouId: ouId,
                                documentClass: selectedDocumentClass
                            })
                        }
                    });
            },
            /**
             * @description Opens popup to edit property configuration
             * @param propertyConfiguration
             * @param $event
             */
            propertyConfigurationEdit: function (propertyConfiguration, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('property-configuration'),
                        controller: 'propertyConfigurationPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            propertyConfiguration: propertyConfiguration
                        }
                    });
            },
            /**
             * @description Show confirm box and delete property configuration
             * @param propertyConfiguration
             * @param $event
             */
            propertyConfigurationDelete: function (propertyConfiguration, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: propertyConfiguration.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deletePropertyConfiguration(propertyConfiguration).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: propertyConfiguration.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk property configurations
             * @param propertyConfigurations
             * @param $event
             */
            propertyConfigurationDeleteBulk: function (propertyConfigurations, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkPropertyConfigurations(propertyConfigurations)
                            .then(function (result) {
                                var response = false;
                                if (result.length === propertyConfigurations.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (propertyConfiguration) {
                                        return propertyConfiguration.getNames();
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
         * @description Add new property configuration
         * @param propertyConfiguration
         * @return {Promise|PropertyConfiguration}
         */
        self.addPropertyConfiguration = function (propertyConfiguration) {
            return $http
                .post(urlService.propertyConfigurations,
                    generator.interceptSendInstance('PropertyConfiguration', propertyConfiguration))
                .then(function (result) {
                    return true;
                })
                .catch(function(error){
                    return false;
                });
        };

        /**
         * @description Update the given property configuration.
         * @param propertyConfiguration
         * @return {Promise|PropertyConfiguration}
         */
        self.updatePropertyConfiguration = function (propertyConfiguration) {
            return $http
                .put(urlService.propertyConfigurations,
                    generator.interceptSendInstance('PropertyConfiguration', propertyConfiguration))
                .then(function (result) {
                    return true;
                })
                .catch(function(error){
                    return false;
                });
        };

        /**
         * @description Delete given property configuration.
         * @param propertyConfiguration
         * @return {Promise|null}
         */
        self.deletePropertyConfiguration = function (propertyConfiguration) {
            var id = propertyConfiguration.hasOwnProperty('id') ? propertyConfiguration.id : propertyConfiguration;
            return $http.delete((urlService.propertyConfigurations + '/' + id));
        };

        /**
         * @description Delete bulk property configurations.
         * @param propertyConfigurations
         * @return {Promise|null}
         */
        self.deleteBulkPropertyConfigurations = function (propertyConfigurations) {
            var bulkIds = propertyConfigurations[0].hasOwnProperty('id') ? _.map(propertyConfigurations, 'id') : propertyConfigurations;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.propertyConfigurations + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedPropertyConfigurations = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedPropertyConfigurations.push(key);
                });
                return _.filter(propertyConfigurations, function (propertyConfiguration) {
                    return (failedPropertyConfigurations.indexOf(propertyConfiguration.id) > -1);
                });
            });
        };

        /**
         * @description Get property configuration by propertyConfigurationId
         * @param propertyConfigurationId
         * @returns {PropertyConfiguration|undefined} return PropertyConfiguration Model or undefined if not found.
         */
        self.getPropertyConfigurationById = function (propertyConfigurationId) {
            propertyConfigurationId = propertyConfigurationId instanceof PropertyConfiguration ? propertyConfigurationId.id : propertyConfigurationId;
            return _.find(self.propertyConfigurations, function (propertyConfiguration) {
                return Number(propertyConfiguration.id) === Number(propertyConfigurationId)
            });
        };

        /**
         * @description Activate property configuration
         * @param propertyConfiguration
         */
        self.activatePropertyConfiguration = function (propertyConfiguration) {
            return $http
                .put((urlService.propertyConfigurations + '/activate/' + propertyConfiguration.id))
                .then(function () {
                    return propertyConfiguration;
                });
        };

        /**
         * @description Deactivate property configuration
         * @param propertyConfiguration
         */
        self.deactivatePropertyConfiguration = function (propertyConfiguration) {
            return $http
                .put((urlService.propertyConfigurations + '/deactivate/' + propertyConfiguration.id))
                .then(function () {
                    return propertyConfiguration;
                });
        };

        /**
         * @description Activate bulk of property configurations
         * @param propertyConfigurations
         */
        self.activateBulkPropertyConfigurations = function (propertyConfigurations) {
            var bulkIds = propertyConfigurations[0].hasOwnProperty('id') ? _.map(propertyConfigurations, 'id') : propertyConfigurations;
            return $http
                .put((urlService.propertyConfigurations + '/activate/bulk'), bulkIds)
                .then(function () {
                    return propertyConfigurations;
                });
        };

        /**
         * @description Deactivate bulk of property configurations
         * @param propertyConfigurations
         */
        self.deactivateBulkPropertyConfigurations = function (propertyConfigurations) {
            var bulkIds = propertyConfigurations[0].hasOwnProperty('id') ? _.map(propertyConfigurations, 'id') : propertyConfigurations;
            return $http
                .put((urlService.propertyConfigurations + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return propertyConfigurations;
                });
        };

        /* /!**
         * @description Set the globalization of property configuration
         * @param propertyConfiguration
         *!/
         self.globalizePropertyConfiguration = function (propertyConfiguration) {
         return $http
         .put(urlService.propertyConfigurations, propertyConfiguration)
         .then(function () {
         return propertyConfiguration;
         });
         };*/

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param propertyConfiguration
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicatePropertyConfiguration = function (propertyConfiguration, editMode) {
            var propertyConfigurationsToFilter = self.propertyConfigurations;
            if (editMode) {
                propertyConfigurationsToFilter = _.filter(propertyConfigurationsToFilter, function (propertyConfigurationToFilter) {
                    return propertyConfigurationToFilter.id !== propertyConfiguration.id;
                });
            }
            return _.some(_.map(propertyConfigurationsToFilter, function (existingPropertyConfiguration) {
                return existingPropertyConfiguration.arName === propertyConfiguration.arName
                    || existingPropertyConfiguration.enName.toLowerCase() === propertyConfiguration.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deletePropertyConfiguration, self.updatePropertyConfiguration);
    });
};
