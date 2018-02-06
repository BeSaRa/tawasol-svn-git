module.exports = function (app) {
    app.controller('managePropertiesDirectiveCtrl', function ($scope,
                                                              lookupService,
                                                              langService,
                                                              employeeService,
                                                              organizationService,
                                                              documentTypeService,
                                                              classificationService,
                                                              documentFileService,
                                                              $timeout,
                                                              toast,
                                                              correspondenceService,
                                                              LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'managePropertiesDirectiveCtrl';
        LangWatcher($scope);
        self.document = null;
        self.maxCreateDate = new Date();
        // all system organizations
        self.organizations = organizationService.organizations;
        // all security level
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.documentFiles = [];
        self.classifications = [];

        $timeout(function () {
            // all document types
            self.documentTypes = correspondenceService.getLookup(self.document.docClassName, 'docTypes');
            self.securityLevels = correspondenceService.getLookup(self.document.docClassName, 'securityLevels');
            _getClassifications(false);
            _getDocumentFiles(false);
        });
        // current employee
        self.employee = employeeService.getEmployee();

        /**
         * @description to check if the given securityLevel included or not.
         * @param securityLevel
         * @param securityLevels
         * @private
         */
        function _securityLevelExist(securityLevel, securityLevels) {
            var Id = securityLevel.hasOwnProperty('id') ? securityLevel.id : securityLevel;
            return _.find(securityLevels, function (item) {
                return item.id === Id;
            });
        }

        /**
         * @description get available documentFiles for the document by security level.
         * @param timeout
         * @returns {*}
         * @private
         */
        function _getDocumentFiles(timeout) {
            if (timeout) {
                return $timeout(function () {
                    self.documentFiles = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'documentFiles'));
                    self.documentFiles = _displayCorrectDocumentFiles(self.documentFiles);
                });
            } else {
                self.documentFiles = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'documentFiles'));
                self.documentFiles = _displayCorrectDocumentFiles(self.documentFiles);
            }
        }

        /**
         * @description get available classifications for the document by security level.
         * @param timeout
         * @returns {*}
         * @private
         */
        function _getClassifications(timeout) {
            if (timeout) {
                return $timeout(function () {
                    self.classifications = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'classifications'));
                    self.classifications = _displayCorrectClassifications(self.classifications);
                });
            } else {
                self.classifications = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'classifications'));
                self.classifications = _displayCorrectClassifications(self.classifications);
            }

        }

        /**
         * @description filter the sub classifications depend on the security level for document.
         * @param classifications
         * @returns {Array}
         * @private
         */
        function _filterSubClassification(classifications) {
            return _.filter(classifications, function (classification) {
                return _securityLevelExist(self.document.securityLevel, classification.securityLevels);
            });
        }

        /**
         * to display the correct classifications
         * @param classifications
         * @returns {Array}
         * @private
         */
        function _displayCorrectClassifications(classifications) {
            return _.filter(classifications, function (ouClassification) {
                ouClassification.classification.children = _filterSubClassification(ouClassification.classification.children);
                return _securityLevelExist(self.document.securityLevel, ouClassification.classification.securityLevels)
            });
        }

        /**
         * @description to display the correct document files
         * @param documentFiles
         * @returns {Array}
         * @private
         */
        function _displayCorrectDocumentFiles(documentFiles) {
            return _.filter(documentFiles, function (ouDocumentFile) {
                return _securityLevelExist(self.document.securityLevel, ouDocumentFile.file.securityLevels)
            });
        }

        /**
         * @description on security level changed
         */
        self.onSecurityLevelChange = function () {
            if (self.document.mainClassification && !_securityLevelExist(self.document.securityLevel, self.document.mainClassification.securityLevels)) {
                self.document.mainClassification = null;
            }

            if (self.document.subClassification && !_securityLevelExist(self.document.securityLevel, self.document.subClassification.securityLevels)) {
                self.document.subClassification = null;
            }

            if (self.document.fileId && !_securityLevelExist(self.document.securityLevel, self.document.fileId.securityLevels)) {
                self.document.fileId = null;
            }
            _getClassifications(false);
            _getDocumentFiles(false);
        };

        self.shortcut = {
            /**
             * add new document as shortcut.
             * @param $event
             */
            addNewDocumentType: function ($event) {
                documentTypeService
                    .controllerMethod
                    .documentTypeAdd($event)
                    .then(function (documentType) {
                        toast.success(langService.get('add_success').change({name: documentType.getNames()}));
                        self.documentTypes.unshift(documentType);
                        self.document.docType = documentType;
                    });
            },
            /**
             * add new documentFile as shortcut.
             * @param $event
             */
            addNewDocumentFile: function ($event) {
                documentFileService
                    .controllerMethod
                    .documentFileAdd($event)
                    .then(function (documentFile) {
                        toast.success(langService.get('add_success').change({name: documentFile.getNames()}));
                        self.documentFiles.unshift(documentFile);
                        self.document.fileId = documentFile;
                    });
            }
        };


        self.onFileChange = function (file) {
            var ouDocumentFile = _.find(self.documentFiles, function (ouDocumentFile) {
                return ouDocumentFile.file.id === file.id;
            });
            if (ouDocumentFile) {
                self.document.fileCode = ouDocumentFile.code || self.document.fileCode;
                self.document.fileSerial = ouDocumentFile.serial || self.document.fileSerial;
            }
        };

        self.onFileCodeChanged = function () {
            var file = _.find(self.documentFiles, function (ouDocumentFile) {
                return (ouDocumentFile.code + '').trim() === (self.document.fileCode + '').trim();
            });

            if (file)
                self.document.fileId = file.file;
        };

        self.saveCorrespondence = function (statue) {
            self.document
                .saveDocument(statue)
                .then(function (result) {
                    self.document = result;
                    toast.success(langService.get('outgoing_metadata_saved_success'));
                    self.model = angular.copy(self.document);
                });
        };
        // if we have source form
        $timeout(function () {
            self.sourceForm = $scope.outgoing_properties;
        });

        $scope.$watch(function () {
            return self.model;
        }, function (newVal) {
            if (newVal)
                self.sourceModel = newVal;
        });

        self.typeOptions = [
            {
                "id": 0,
                "arName": "شخصى",
                "enName": "Personal"
            },
            {
                "id": 1,
                "arName": "إداري",
                "enName": "Departmental"
            }];
    });
};