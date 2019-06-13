module.exports = function (app) {
    app.service('classificationService', function (urlService,
                                                   toast,
                                                   cmsTemplate,
                                                   langService,
                                                   dialog,
                                                   errorCode,
                                                   $http,
                                                   Pair,
                                                   $q,
                                                   generator,
                                                   Classification,
                                                   OUClassification,
                                                   _) {
        'ngInject';
        var self = this;
        self.serviceName = 'classificationService';

        self.classifications = [];

        /**
         * @description load classifications from server.
         * @returns {Promise|classifications}
         */
        self.loadClassifications = function () {
            return $http.get(urlService.classifications).then(function (result) {
                self.classifications = generator.generateCollection(result.data.rs, Classification, self._sharedMethods);
                self.classifications = generator.interceptReceivedCollection('Classification', self.classifications);
                return self.classifications;
            });
        };
        /**
         * @description get classifications from self.classifications if found and if not load it from server again.
         * @returns {Promise|classifications}
         */
        self.getClassifications = function () {
            return self.classifications.length ? $q.when(self.classifications) : self.loadClassifications();
        };

        /**
         * @description load classifications with limit up to 50
         * @param limit
         * @return {*}
         */
        self.loadClassificationsWithLimit = function (limit) {
            return $http
                .get(urlService.entityWithlimit.replace('{entityName}', 'classification').replace('{number}', limit ? limit : 50))
                .then(function (result) {
                    self.classifications = generator.generateCollection(result.data.rs, Classification, self._sharedMethods);
                    self.classifications = generator.interceptReceivedCollection('Classification', self.classifications);
                    return self.classifications;
                });
        };

        /**
         * @description load classifications(global and private to current OU) with searchText
         * @param searchText
         * @param securityLevel
         * @param parent
         * @return {*}
         */
        self.loadClassificationsPairBySearchText = function (searchText, securityLevel, parent) {
            if (typeof securityLevel === 'undefined') {
                securityLevel = null;
            } else {
                if (securityLevel !== null && securityLevel.hasOwnProperty('lookupKey'))
                    securityLevel = securityLevel.lookupKey;
            }
            if (typeof parent === 'undefined' || parent == null) {
                parent = null;
            } else {
                if (parent.hasOwnProperty('id'))
                    parent = parent.id;
            }
            return $http.get(urlService.entityBySearchText.replace('{entityName}', 'classification'), {
                params: {
                    criteria: searchText,
                    parent: parent,
                    securityLevel: securityLevel
                }
            }).then(function (result) {
                result = result.data.rs;
                result.first = generator.interceptReceivedCollection('Classification', generator.generateCollection(result.first, Classification, self._sharedMethods));
                result.second = generator.interceptReceivedCollection('OUClassification', generator.generateCollection(result.second, OUClassification));
                return result;
            });
        };

        /**
         * @description load sub classification by parent Id
         * @param classification
         * @return {*}
         */
        self.loadSubClassifications = function (classification) {
            var id = classification.hasOwnProperty('id') ? classification.id : classification;
            return $http
                .get(urlService.childrenEntities.replace('{entityName}', 'classification').replace('{entityId}', id))
                .then(function (result) {
                    return generator.interceptReceivedCollection('Classification', generator.generateCollection(result.data.rs, Classification, self._sharedMethods));
                });
        };

        /**
         * @description get classification by classificationId
         * @param classificationId
         * @returns {Classification|undefined} return Classification Model or undefined if not found.
         */
        self.getClassificationById = function (classificationId) {
            classificationId = classificationId instanceof Classification ? classificationId.id : classificationId;
            return _.find(self.classifications, function (classification) {
                return Number(classification.id) === Number(classificationId)
            });
        };

        /**
         * @description Filters parent classifications
         * @param excludeClassification
         * @return {Array}
         */
        self.getParentClassifications = function (excludeClassification) {
            return _.filter(self.classifications, function (classification) {
                if (excludeClassification)
                    return !classification.parent && excludeClassification.id !== classification.id;
                else
                    return !classification.parent;
            });
        };

        /**
         * @description Filters the main classifications from given classifications
         * @param classifications
         * @returns {Array}
         */
        self.getMainClassifications = function (classifications) {
            return _.filter(classifications, function (classification) {
                return !classification.parent;
            })
        };

        /**
         * @description Contains methods for CRUD operations for classifications
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new classification
             * @param parentClassification
             * @param defaultOU
             * @param $event
             */
            classificationAdd: function (parentClassification, defaultOU, $event) {
                var classification = new Classification({
                    parent: parentClassification,
                    securityLevels: parentClassification ? parentClassification.securityLevels : null,
                    isGlobal: (!!defaultOU) ? false : (parentClassification ? parentClassification.isGlobal : true),
                    relatedOus: defaultOU ? [defaultOU] : []
                });

                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('classification'),
                        controller: 'classificationPopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: false,
                            classification: classification,
                            defaultOU: defaultOU
                        }
                    });
            },
            /**
             * @description Opens popup to edit classification
             * @param classification
             * @param defaultOU
             * @param $event
             */
            classificationEdit: function (classification, defaultOU, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('classification'),
                        controller: 'classificationPopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: true,
                            classification: (defaultOU ? classification.classification : classification),
                            defaultOU: defaultOU
                        }
                    });
            },
            /**
             * @description Show confirm box and delete classification
             * @param classification
             * @param $event
             */
            classificationDelete: function (classification, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: classification.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteClassification(classification)
                            .then(function () {
                                toast.success(langService.get('delete_specific_success').change({name: classification.getNames()}));
                                return true;
                            })
                            .catch(function (error) {
                                return errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                                    dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                                        lookup: langService.get('classification'),
                                        used: langService.get('document')
                                    }), null, null, $event);
                                    return $q.reject('CAN_NOT_DELETE_LOOKUP');
                                })
                            });
                    });
            },
            /**
             * @description Show confirm box and delete bulk classifications
             * @param classifications
             * @param $event
             */
            classificationDeleteBulk: function (classifications, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkClassifications(classifications);
                    });
            },
            /**
             * @description view sub Classifications
             * @param mainClassification
             * @param $event
             * @return {promise}
             */
            viewSubClassifications: function (mainClassification, $event) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('sub-classification'),
                        controller: 'subClassificationViewPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            mainClassification: mainClassification
                        },
                        resolve: {
                            subClassifications: function () {
                                'ngInject';
                                return self.loadSubClassifications(mainClassification);
                            }
                        }
                    });
            },
            /**
             * @description Opens popup for adding classification to OU from organization popup
             * @param excluded
             * @returns {promise}
             */
            showClassificationSelector: function (excluded) {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('classifications-selector'),
                    controller: 'classificationSelectorPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        excluded: excluded
                    },
                    resolve: {
                        classifications: function () {
                            'ngInject';
                            return self.loadClassificationsWithLimit(100);
                        }
                    }
                });
            }
        };

        /**
         * @description add new classification to service
         * @param classification
         * @return {Promise|Classification}
         */
        self.addClassification = function (classification) {
            return $http
                .post(urlService.classifications,
                    generator.interceptSendInstance('Classification', classification))
                .then(function (result) {
                    classification.id = result.data.rs;
                    classification.groupPrefix = 'cl_' + classification.id;
                    return generator.generateInstance(classification, Classification, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given classification.
         * @param classification
         * @return {Promise|Classification}
         */
        self.updateClassification = function (classification) {
            return $http
                .put(urlService.classifications,
                    generator.interceptSendInstance('Classification', classification))
                .then(function () {
                    return generator.generateInstance(classification, Classification, self._sharedMethods);
                });
        };
        /**
         * @description delete given classification.
         * @param classification
         * @return {Promise}
         */
        self.deleteClassification = function (classification) {
            var id = classification.hasOwnProperty('id') ? classification.id : classification;
            return $http
                .delete((urlService.classifications + '/' + id));
        };
        /**
         * @description Delete bulk organization types.
         * @param classifications
         * @return {Promise|null}
         */
        self.deleteBulkClassifications = function (classifications) {
            var bulkIds = classifications[0].hasOwnProperty('id') ? _.map(classifications, 'id') : classifications;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.classifications + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedClassifications = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedClassifications.push(key);
                });
                return _.filter(classifications, function (classification) {
                    return (failedClassifications.indexOf(classification.id) > -1);
                });
            });
        };

        /**
         * @description Activate classification
         * @param classification
         */
        self.activateClassification = function (classification) {
            return $http
                .put((urlService.classifications + '/activate/' + classification.id))
                .then(function () {
                    return classification;
                });
        };

        /**
         * @description Deactivate classification
         * @param classification
         */
        self.deactivateClassification = function (classification) {
            return $http
                .put((urlService.classifications + '/deactivate/' + classification.id))
                .then(function () {
                    return classification;
                });
        };

        /**
         * @description Activate bulk classifications
         * @param classifications
         */
        self.activateBulkClassifications = function (classifications) {
            var bulkIds = classifications[0].hasOwnProperty('id') ? _.map(classifications, 'id') : classifications;
            return $http
                .put((urlService.classifications + '/activate/bulk'), bulkIds)
                .then(function (result) {
                    //return classifications;
                    return generator.getBulkActionResponse(result, classifications, false, 'failed_activate_selected', 'success_activate_selected', 'success_activate_selected_except_following');
                });
        };

        /**
         * @description Deactivate bulk classifications
         * @param classifications
         */
        self.deactivateBulkClassifications = function (classifications) {
            var bulkIds = classifications[0].hasOwnProperty('id') ? _.map(classifications, 'id') : classifications;
            return $http
                .put((urlService.classifications + '/deactivate/bulk'), bulkIds)
                .then(function (result) {
                    //return classifications;
                    return generator.getBulkActionResponse(result, classifications, false, 'failed_deactivate_selected', 'success_deactivate_selected', 'success_deactivate_selected_except_following');
                });
        };

        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteClassification, self.updateClassification);

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param classification
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateClassification = function (classification, editMode) {
            var classificationsToFilter = self.classifications;
            if (editMode) {
                classificationsToFilter = _.filter(classificationsToFilter, function (classificationToFilter) {
                    return classificationToFilter.id !== classification.id;
                });
            }
            return _.some(_.map(classificationsToFilter, function (existingClassification) {
                return existingClassification.arName === classification.arName
                    || existingClassification.enName.toLowerCase() === classification.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Filters the sub classifications for given main classification
         * @param mainClassification
         * @returns {Array}
         */
        self.getSubClassifications = function (mainClassification) {
            mainClassification = mainClassification.hasOwnProperty('id') ? mainClassification.id : mainClassification;
            return _.filter(self.classifications, function (classification) {
                if (classification.parent instanceof Classification)
                    return classification.parent.id === mainClassification;
                else
                    return classification.parent === mainClassification;
            });
        };

        /**
         * @description search in classifications .
         * @param searchText
         * @param parent
         * @return {*}
         */
        self.classificationSearch = function (searchText, parent) {
            return $http.get(urlService.classifications + '/criteria', {
                params: {
                    criteria: searchText,
                    parent: typeof parent !== 'undefined' ? (parent.hasOwnProperty('id') ? parent.id : parent) : null
                }
            }).then(function (result) {
                return generator.interceptReceivedCollection('Classification', generator.generateCollection(result.data.rs, Classification, self._sharedMethods));
            });
        }
    });
};
