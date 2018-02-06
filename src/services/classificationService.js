module.exports = function (app) {
    app.service('classificationService', function (urlService,
                                                   toast,
                                                   cmsTemplate,
                                                   langService,
                                                   dialog,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   Classification,
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
                url: urlService.classifications + '/' + 'bulk',
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
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteClassification, self.updateClassification);

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
         * @description get children for parent classifications
         * @param parents classifications to get they children
         * @param children classifications to search in
         * @return {Array}
         */
        self.getChildrenClassifications = function (parents, children) {
            return _.map(parents, function (classification) {
                classification.children = [];
                if (children.hasOwnProperty(classification.id)) {
                    classification.setChildren(children[classification.id]);
                }
                return classification;
            });
        };
        /**
         * @description to make separation between parents and children records
         * @param classifications
         * @param parents
         * @param children
         * @return {*}
         */
        self.classificationSeparator = function (classifications, parents, children) {
            _.map(classifications, function (classification) {
                var parent = classification.parent;
                if (!parent) {
                    parents.push(classification);
                } else {
                    if (!children.hasOwnProperty(parent)) {
                        children[parent] = [];
                    }
                    children[parent].push(classification);
                }
            });
            return self;
        };
        /**
         * @description to create the hierarchy for the parent and child for classifications
         * @param classifications
         * @return {Array| Classification} array of parents classifications
         */
        self.createClassificationHierarchy = function (classifications) {
            var parents = [], children = {};
            return self
                .classificationSeparator(classifications, parents, children)
                .getChildrenClassifications(parents, children);
        };
        /**
         * @description get parent classifications
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
                .then(function () {
                    return classifications;
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
                .then(function () {
                    return classifications;
                });
        };
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

        self.getMainClassifications = function (classifications) {
            return _.filter(classifications, function (classification) {
                return !classification.parent;
            })
        };

        self.getSubClassifications = function (mainClassification) {
            mainClassification = mainClassification.hasOwnProperty('id')? mainClassification.id : mainClassification;
            return _.filter(self.classifications, function (classification) {
                if (classification.parent instanceof Classification)
                    return classification.parent.id === mainClassification;
                else
                    return classification.parent === mainClassification;
            });
        };

        /**
         * @description Contains methods for CRUD operations for classifications
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new classification
             * @param parentClassification
             * @param sub
             * @param $event
             */
            classificationAdd: function (parentClassification, sub, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('classification'),
                        controller: 'classificationPopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: false,
                            classification: new Classification(),
                            classifications: self.classifications,
                            parent: parentClassification,
                            sub: sub
                        }
                    });
            },
            /**
             * @description Opens popup to edit classification
             * @param classification
             * @param $event
             */
            classificationEdit: function (classification, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('classification'),
                        controller: 'classificationPopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: true,
                            classification: classification,
                            classifications: self.classifications,
                            parent: classification.parent,
                            sub: false
                        }
                    });
            },
            subClassificationEdit: function (classification, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('classification'),
                        controller: 'classificationPopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: true,
                            classification: classification,
                            classifications: self.classifications,
                            parent: classification.parent,
                            sub: false
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
                        return self.deleteBulkClassifications(classifications)
                            .then(function (result) {
                                var response = false;
                                if (result.length === classifications.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (classification) {
                                        return classification.getNames();
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
             * @description view sub Classifications
             * @param classification
             * @param $event
             * @return {promise}
             */
            viewSubClassifications: function (classification, $event) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('sub-classification'),
                        controller: 'subClassificationViewPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            classification: classification,
                            classifications: self.getMainClassifications(self.classifications)
                        }
                    });
            },
            showClassificationSelector: function (excluded) {
                return dialog.showDialog({
                    template: cmsTemplate.getPopup('classifications-selector'),
                    controller: 'classificationSelectorPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        excluded: excluded
                    }
                });
            }
        };
    });
};