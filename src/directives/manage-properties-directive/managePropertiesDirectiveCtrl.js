module.exports = function (app) {
    app.controller('managePropertiesDirectiveCtrl', function ($scope,
                                                              lookupService,
                                                              langService,
                                                              employeeService,
                                                              $stateParams,
                                                              organizationService,
                                                              documentTypeService,
                                                              classificationService,
                                                              documentFileService,
                                                              $timeout,
                                                              toast,
                                                              _,
                                                              correspondenceService,
                                                              LangWatcher,
                                                              generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'managePropertiesDirectiveCtrl';
        LangWatcher($scope);
        var properties = [];
        self.document = null;
        self.maxCreateDate = new Date();

        // all security level
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.documentFiles = [];
        self.classifications = [];
        var required = {};

        $timeout(function () {
            // all system organizations
            self.organizations = self.centralArchives ? self.centralArchives : organizationService.organizations;
            // all document types
            self.documentTypes = correspondenceService.getLookup(self.document.docClassName, 'docTypes');
            self.securityLevels = correspondenceService.getLookup(self.document.docClassName, 'securityLevels');
            properties = lookupService.getPropertyConfigurations(self.document.docClassName);
            _getClassifications(false);
            _getDocumentFiles(false);
        });
        // current employee
        self.employee = employeeService.getEmployee();
        // for sub organizations
        self.subOrganizations = [];
        // required fields for the current document class
        self.required = {};
        // need  timeout here to start init each property mandatory.
        $timeout(function () {
            _.map(properties, function (item) {
                // self.required[item.symbolicName.toLowerCase()] = item.isMandatory;
                self.required[item.symbolicName.toLowerCase()] = {isMandatory: item.isMandatory, status: item.status};
            });
        });

        self.checkMandatory = function (fieldName) {
            return self.required[fieldName.toLowerCase()] && self.required[fieldName.toLowerCase()].isMandatory;
        };

        self.checkStatus = function (fieldName) {
            return self.required[fieldName.toLowerCase()] && self.required[fieldName.toLowerCase()].status;
        };


        /**
         * @description to check if the given securityLevel included or not.
         * @param securityLevel
         * @param securityLevels
         * @private
         */
        function _securityLevelExist(securityLevel, securityLevels) {
            var Id = securityLevel && securityLevel.hasOwnProperty('id') ? securityLevel.id : securityLevel;
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
                return file && ouDocumentFile.file.id === file.id;
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
            //self.disableProperties = self.checkIfEditDisabled(self.document)
        });

        $scope.$watch(function () {
            return self.model;
        }, function (newVal) {
            if (newVal)
                self.sourceModel = newVal;
        });

        self.typeOptions = [
            {
                key: 'personal',
                value: 0
            },
            {
                key: 'departmental',
                value: 1
            }
        ];

        self.checkCentralDisabled = function (documentClass) {
            return self.employee.inCentralArchive() && self.document && documentClass.indexOf(self.document.docClassName.toLowerCase()) !== -1;
        };

        self.isNormalOrganization = function () {
            return !self.employee.inCentralArchive() && self.document;
        };

        self.checkOrganizationDisabled = function () {
            // if no document provided or still the controller prepare the instance.
            if (!self.document)
                return false;
            // disable organization when edit mode for any case || if in add mode and the current employee not in central archive organization.
            if ((self.document.hasVsId() && $stateParams.action !== 'receiveg2g') || !self.employee.inCentralArchive()) {
                return true;
            }
            /*if ((self.document.hasVsId() && self.receiveG2g) || !self.employee.inCentralArchive()) {
                return true;
            }*/
            // if this document new and internal or outgoing electronic disable the select organization.
            return !!(self.document.hasDocumentClass('internal') || (self.document.hasDocumentClass('outgoing') && !self.document.addMethod));

        };

        /**
         * @description check if document received from incoming department
         * @returns {*|boolean}
         */
        self.checkDepartmentalReceived = function () {
            return self.document.hasVsId() && $stateParams.action === 'receive';
        };

        /**
         * @description check if document received from incoming department
         * @returns {*|boolean}
         */
        self.checkG2gReceived = function () {
            return (self.document.hasVsId() && $stateParams.action === 'receiveg2g');
        };

        /**
         * @description on registry change.
         * @param organizationId
         */
        self.onRegistryChange = function (organizationId) {
            self.subOrganizations = [];
            organizationService
                .loadChildrenOrganizations(organizationId)
                .then(function (result) {
                    // self.organizations = result;
                    self.subOrganizations = result;
                });
        };

        self.showRegistryUnit = function () {
            return self.registryOrganizations && self.registryOrganizations.length && employeeService.isCentralArchive() && self.document && self.document.addMethod && (self.document.classDescription.toLowerCase() === 'outgoing' || self.document.classDescription.toLowerCase() === 'incoming');
        };

        self.checkIncomingDateValid = function () {
            if (self.document.hasDocumentClass('incoming')) {
                var docDate = self.document.docDate,
                    refDocDate = self.document.refDocDate;

                if (docDate && refDocDate) {
                    if (new Date(docDate).getTime() < new Date(refDocDate).getTime())
                        self.document.refDocDate = null;
                }
                else {
                    self.document.refDocDate = null;
                }
            }
        };

        /**
         * @description Check if the document is approved. If yes, don't allow to change properties and correspondence sites
         * @param document
         * @returns {boolean}
         */
        /*self.checkIfEditDisabled = function (document) {
            if (!document)
                return true;
            /!*If document is approved, don't allow to edit whether it is any document*!/
            /!*If electronic outgoing/electronic internal and approved, don't allow to edit*!/
            /!*If incoming, allow to edit*!/
            /!*If not approved, allow to edit will depend on permission*!/

            /!*FROM SRS*!/
            /!*Outgoing properties can be editable at any time in department ready to export *!/
            /!*Outgoing content can be available if paper outgoing*!/
            /!*Correspondence Sites can be editable if document is unapproved*!/
            var info = document.getInfo();
            var isApproved = info.docStatus >= 24;
            if (isApproved)
                return true;

            var hasPermission = false;
            if (info.documentClass === "outgoing")
                hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
            else if (info.documentClass === "internal")
                hasPermission = (employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT"));
            else if (info.documentClass === "incoming")
                hasPermission = (employeeService.hasPermissionTo("EDIT_INCOMING'S_PROPERTIES") || employeeService.hasPermissionTo("EDIT_INCOMING'S_CONTENT"));
            return (isApproved && hasPermission);
            //return (isApproved && ((info.documentClass === "outgoing" || info.documentClass === "internal") && !info.isPaper) && hasPermission);
        };*/
    });
};