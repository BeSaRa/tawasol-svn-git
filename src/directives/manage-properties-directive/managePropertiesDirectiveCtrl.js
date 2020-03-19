module.exports = function (app) {
    app.controller('managePropertiesDirectiveCtrl', function ($scope,
                                                              lookupService,
                                                              langService,
                                                              employeeService,
                                                              $stateParams,
                                                              organizationService,
                                                              documentTypeService,
                                                              documentFileService,
                                                              OUDocumentFile,
                                                              DocumentFile,
                                                              DocumentType,
                                                              $timeout,
                                                              toast,
                                                              _,
                                                              generator,
                                                              correspondenceService,
                                                              LangWatcher,
                                                              gridService,
                                                              classificationService,
                                                              OUClassification,
                                                              Classification) {
        'ngInject';
        var self = this;
        self.controllerName = 'managePropertiesDirectiveCtrl';
        LangWatcher($scope);
        self.employeeService = employeeService;
        self.fieldsPerRow = 4;
        var properties = [], mainClassificationOptionFromInfo, subClassificationOptionFromInfo,
            documentFileOptionFromInfo, documentSecurityLevelLookupKey;
        self.document = null;
        self.maxCreateDate = new Date();

        // all priority level
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.documentFiles = [];
        self.classifications = [];
        self.registryOUSearchText = '';
        self.registrySectionSearchText = '';
        self.ouSearchText = '';

        self.mainClassificationSearchText = '';
        self.subClassificationSearchText = '';
        self.documentFileSearchText = '';
        self.isSecurityLevelEnabled = false;

        // required fields for the current document class
        self.required = {};

        /**
         * @description Set the required and active properties for each field from property configuration
         * @private
         */
        function _setRequiredFieldsFromConfiguration() {
            properties = angular.copy(lookupService.getPropertyConfigurations(self.document.docClassName));

            _.map(properties, function (item) {
                // if subClassification is required, force require the mainClassification as well
                if (item.symbolicName.toLowerCase() === 'subclassification') {
                    if (item.status) {
                        _forceSetActive('MainClassification');
                    }
                    if (item.isMandatory) {
                        _forceSetMandatory('MainClassification');
                    }
                }
                self.required[item.symbolicName.toLowerCase()] = {isMandatory: item.isMandatory, status: item.status};
            });
        }

        $timeout(function () {
            self.sourceForm = $scope.outgoing_properties;

            // all system organizations
            self.organizations = self.centralArchives ? self.centralArchives : organizationService.organizations;
            // sort organizations
            if (self.organizations && self.organizations.length) {
                self.organizations = _.sortBy(self.organizations, [function (ou) {
                    return ou[langService.current + 'Name'].toLowerCase();
                }]);
            }
            // sort regOus
            if (self.registryOrganizations && self.registryOrganizations.length) {
                self.registryOrganizations = _.sortBy(self.registryOrganizations, [function (ou) {
                    return ou[langService.current + 'Name'].toLowerCase();
                }]);
            }
            // all document types
            self.documentTypes = correspondenceService.getLookup(self.document.docClassName, 'docTypes');
            self.securityLevels = correspondenceService.getLookup(self.document.docClassName, 'securityLevels');
            documentSecurityLevelLookupKey = angular.copy(self.document.securityLevel);
            if (documentSecurityLevelLookupKey.hasOwnProperty('lookupKey')) {
                documentSecurityLevelLookupKey = documentSecurityLevelLookupKey.lookupKey;
            }

            _setRequiredFieldsFromConfiguration();

            if (self.document.hasVsId() && self.document.mainClassificationInfo.id !== -1) {
                mainClassificationOptionFromInfo = new OUClassification({
                    classification: new Classification({
                        id: self.document.mainClassificationInfo.id,
                        arName: self.document.mainClassificationInfo.arName,
                        enName: self.document.mainClassificationInfo.enName,
                        securityLevels: documentSecurityLevelLookupKey
                    })
                });
            }
            if (self.document.hasVsId() && self.document.subClassificationInfo.id !== -1) {
                subClassificationOptionFromInfo = new Classification({
                    id: self.document.subClassificationInfo.id,
                    arName: self.document.subClassificationInfo.arName,
                    enName: self.document.subClassificationInfo.enName,
                    securityLevels: documentSecurityLevelLookupKey,
                    parent: mainClassificationOptionFromInfo.classification.id
                });
            }
            if (self.document.hasVsId() && self.document.documentFileInfo.id !== -1) {
                documentFileOptionFromInfo = new OUDocumentFile({
                    file: new DocumentFile({
                        id: self.document.documentFileInfo.id,
                        arName: self.document.documentFileInfo.arName,
                        enName: self.document.documentFileInfo.enName,
                        securityLevels: documentSecurityLevelLookupKey
                    })
                });
            }
            if (typeof self.document.mainClassification === 'number' && mainClassificationOptionFromInfo) {
                self.document.mainClassification = mainClassificationOptionFromInfo.classification;
            }
            if (typeof self.document.subClassification === 'number' && subClassificationOptionFromInfo) {
                self.document.subClassification = subClassificationOptionFromInfo;
            }
            if (typeof self.document.fileId === 'number' && documentFileOptionFromInfo) {
                self.document.fileId = documentFileOptionFromInfo.file;
            }

            _getClassifications(false);
            _getDocumentFiles(false);

            _selectFirstOptionForRequired();
        });


        /**
         * @description Finds the property configuration by symbolic name
         * @param symbolicName
         * @returns {*|null}
         * @private
         */
        var _findPropertyConfiguration = function (symbolicName) {
            if (!symbolicName) {
                return null;
            }
            return _.find(properties, function (item) {
                return item.symbolicName.toLowerCase() === symbolicName.toLowerCase();
            }) || null;
        };

        /**
         * @description Forcefully set the mandatory property for given symbolicName
         * @param forceMandatorySymbolicName
         * @private
         */
        var _forceSetMandatory = function (forceMandatorySymbolicName) {
            var property = _findPropertyConfiguration(forceMandatorySymbolicName);
            if (property) {
                property.isMandatory = true;
                self.required[forceMandatorySymbolicName.toLowerCase()] = {isMandatory: true, status: property.status};
            }
        };

        /**
         * @description Forcefully set the status active for given symbolicName
         * @param forceActiveSymbolicName
         * @private
         */
        var _forceSetActive = function (forceActiveSymbolicName) {
            var property = _findPropertyConfiguration(forceActiveSymbolicName);
            if (property) {
                property.status = true;
                self.required[forceActiveSymbolicName.toLowerCase()] = {
                    isMandatory: property.isMandatory,
                    status: true
                };
            }
        };


        // current employee
        self.employee = employeeService.getEmployee();
        // for sub organizations
        self.subOrganizations = [];

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
                item = item.hasOwnProperty('id') ? item.id : item;
                return item === Id;
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
                    _appendMissingDocumentFile();
                });
            } else {
                self.documentFiles = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'documentFiles'));
                self.documentFiles = _displayCorrectDocumentFiles(self.documentFiles);
                _appendMissingDocumentFile();
            }
        }

        /**
         * @description get available classifications for the document by security level.
         * @param timeout
         * @returns {*}
         * @private
         */
        function _getClassifications(timeout) {
            var mainClassificationControl;
            if (timeout) {
                return $timeout(function () {
                    self.classifications = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'classifications'));
                    self.classifications = _displayCorrectClassifications(self.classifications);
                    appendMissingMainClassification();
                    mainClassificationControl = _getFormControlByName('mainClassification');
                    self.onChangeMainClassification(null, true, mainClassificationControl);
                });
            } else {
                self.classifications = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'classifications'));
                self.classifications = _displayCorrectClassifications(self.classifications);
                appendMissingMainClassification();
                mainClassificationControl = _getFormControlByName('mainClassification');
                self.onChangeMainClassification(null, true, mainClassificationControl);
            }
        }

        var appendMissingMainClassification = function () {
            // if new document or Info is empty, return;
            if (self.isNewDocument || !self.document.mainClassificationInfo || self.document.mainClassificationInfo.id === -1) {
                self.classificationsCopy = angular.copy(self.classifications);
                return;
            }

            if (mainClassificationOptionFromInfo && (mainClassificationOptionFromInfo instanceof OUClassification)) {
                var selectedClassification = _.find(self.classifications, function (classification) {
                    return classification.classification.id === mainClassificationOptionFromInfo.classification.id;
                });
                // if selected option exists in list, return. Otherwise, push option from info.
                if (selectedClassification) {
                    self.classificationsCopy = angular.copy(self.classifications);
                    return;
                }
                if (mainClassificationOptionFromInfo.classification.securityLevels === documentSecurityLevelLookupKey) {
                    self.classifications.push(mainClassificationOptionFromInfo);
                }
            }
            self.classificationsCopy = angular.copy(self.classifications);
        };

        var _appendMissingSubClassification = function () {
            // if new document or Info is empty, return;
            if (self.isNewDocument || !self.document.subClassificationInfo || self.document.subClassificationInfo.id === -1) {
                self.classificationsCopy = angular.copy(self.classifications);
                return;
            }

            if (subClassificationOptionFromInfo && (subClassificationOptionFromInfo instanceof Classification)) {
                var selectedSubClassification = _.find(self.document.mainClassification.children, function (subClassification) {
                    return subClassification.id === subClassificationOptionFromInfo.id;
                });
                // if selected option exists in list, return. Otherwise, push option from info.
                if (selectedSubClassification) {
                    self.classificationsCopy = angular.copy(self.classifications);
                    return;
                }

                var mainClassificationId = angular.copy(self.document.mainClassification);
                if (mainClassificationId && mainClassificationId.hasOwnProperty('id')) {
                    mainClassificationId = mainClassificationId.id;
                }
                if (subClassificationOptionFromInfo.securityLevels === documentSecurityLevelLookupKey && mainClassificationId === subClassificationOptionFromInfo.parent) {
                    self.document.mainClassification.children.push(subClassificationOptionFromInfo);
                }
            }
            self.classificationsCopy = angular.copy(self.classifications);
        };

        var _appendMissingDocumentFile = function () {
            // if new document or Info is empty, return;
            if (self.isNewDocument || !self.document.documentFileInfo || self.document.documentFileInfo.id === -1) {
                self.documentFilesCopy = angular.copy(self.documentFiles);
                return;
            }

            if (documentFileOptionFromInfo && (documentFileOptionFromInfo instanceof OUDocumentFile)) {
                var selectedDocumentFile = _.find(self.documentFiles, function (documentFile) {
                    return documentFile.file.id === documentFileOptionFromInfo.file.id;
                });
                // if selected option exists in list, return. Otherwise, push option from info.
                if (selectedDocumentFile) {
                    self.documentFilesCopy = angular.copy(self.documentFiles);
                    return;
                }

                if (documentFileOptionFromInfo.file.securityLevels === documentSecurityLevelLookupKey) {
                    self.documentFiles.push(documentFileOptionFromInfo);
                }
            }
            self.documentFilesCopy = angular.copy(self.documentFiles);
        };

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

        function _getFormControlByName(fieldName) {
            if (!fieldName || !self.sourceForm) {
                return null;
            }
            return _.find(self.sourceForm.$$controls, function (control) {
                return control.$name.toLowerCase() === fieldName.toLowerCase();
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

            if (self.document.hasDocumentClass('outgoing') && self.document.isPrivateSecurityLevel())
                self.document.isComposite = false;

            documentSecurityLevelLookupKey = angular.copy(self.document.securityLevel);
            if (documentSecurityLevelLookupKey.hasOwnProperty('lookupKey')) {
                documentSecurityLevelLookupKey = documentSecurityLevelLookupKey.lookupKey;
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
                documentTypeService.getDocumentTypes()
                    .then(function () {
                        documentTypeService
                            .controllerMethod
                            .documentTypeAdd($event, self.document.docClassName)
                            .then(function (documentType) {
                                toast.success(langService.get('add_success').change({name: documentType.getNames()}));
                                self.documentTypes.unshift(documentType);
                                self.document.docType = documentType;
                            }).catch(function (catchDocumentType) {
                            if (catchDocumentType && catchDocumentType instanceof DocumentType && !catchDocumentType.isEmpty()) {
                                self.documentTypes.unshift(catchDocumentType);
                                self.document.docType = catchDocumentType;
                            }
                        })
                    });
            },
            /**
             * add new documentFile as shortcut.
             * @param $event
             */
            addNewDocumentFile: function ($event) {
                documentFileService.getDocumentFiles()
                    .then(function () {
                        documentFileService
                            .controllerMethod
                            .documentFileAdd(null, $event, self.document.docClassName)
                            .then(function (documentFile) {
                                // toast.success(langService.get('add_success').change({name: documentFile.getNames()}));
                                self.documentFiles.unshift(new OUDocumentFile({file: documentFile}));
                                self.documentFilesCopy = angular.copy(self.documentFiles);
                                self.document.fileId = documentFile;
                            }).catch(function (catchDocumentFile) {
                            if (catchDocumentFile && catchDocumentFile instanceof DocumentFile && !catchDocumentFile.isEmpty()) {
                                self.documentFiles.unshift(new OUDocumentFile({file: catchDocumentFile}));
                                self.documentFilesCopy = angular.copy(self.documentFiles);
                                self.document.fileId = catchDocumentFile;
                            }
                        })
                    })
            }
        };


        self.onFileChange = function (file, field) {
            self.checkNullValues(field);
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
                }).catch(function (error) {
                toast.error(error);
            });
        };


        $scope.$watch(function () {
            return self.model;
        }, function (newVal) {
            if (newVal)
                self.sourceModel = newVal;
        });

        $scope.$watch(function () {
            return self.isNewDocument;
        }, function (newVal) {
            if (newVal)
                _selectFirstOptionForRequired();
        });

        self.typeOptions = [
            {
                key: 'personal',
                value: 0,
                sortIndex: 2
            },
            {
                key: 'departmental',
                value: 1,
                sortIndex: 1
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
         * @param field
         */
        self.onRegistryChange = function (organizationId, field) {
            self.checkNullValues(field);
            self.subOrganizations = [];
            organizationService
                .loadChildrenOrganizations(organizationId)
                .then(function (result) {
                    // sort sub organizations
                    if (result && result.length) {
                        result = _.sortBy(result, [function (ou) {
                            return ou[langService.current + 'Name'].toLowerCase();
                        }]);
                    }
                    self.subOrganizations = result;
                    self.document.ou = null;
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
                } else {
                    self.document.refDocDate = null;
                }
            }
        };

        /**
         * @description make first option selected by default if dropdown required
         *  @private
         */
        function _selectFirstOptionForRequired() {
            var fields = [
                {
                    name: 'registryOU',
                    options: 'registryOrganizations',
                    value: 'id'
                },
                {
                    name: 'mainClassification',
                    options: 'classifications',
                    value: 'classification'
                },
                {
                    name: 'subClassification',
                    options: 'document.mainClassification.children'
                },
                {
                    name: 'securityLevel',
                    options: 'securityLevels'
                },
                {
                    name: 'internalDocType',
                    options: 'typeOptions',
                    value: 'value'
                },
                {
                    name: 'priorityLevel',
                    options: 'priorityLevels'
                },
                {
                    name: 'docType',
                    options: 'documentTypes'
                },
                {
                    name: 'fileId',
                    options: 'documentFiles',
                    value: 'file'
                }];

            if (!self.document.hasVsId() || $stateParams.action === 'editAfterApproved' || $stateParams.action === 'editAfterExport'
                || $stateParams.action === 'reply' || $stateParams.action === 'duplicateVersion' || $stateParams.action === 'receiveg2g' || $stateParams.action === 'receive') {
                for (var f = 0; f < fields.length; f++) {
                    var field = fields[f], options = _.get(self, field.options);
                    if (self.checkStatus(field.name) && self.checkMandatory(field.name) && options && options.length) {
                        // if there is no value selected by default
                        if (typeof self.document[field.name] === 'undefined' || self.document[field.name] === null || self.document[field.name] === '')
                            self.document[field.name] = (field.value) ? options[0][field.value] : options[0];

                        if (field.name === 'registryOU') {
                            self.onRegistryChange(self.document.registryOU);
                        }

                        if (field.name === 'mainClassification') {
                            var mainClassificationField = _getFormControlByName('mainClassification');
                            self.onChangeMainClassification(null, false, mainClassificationField);
                        }
                    }
                }
            }
            self.isNewDocument = false;
        }


        /**
         * @description Set the sub classification on change of main classification
         * @param $event
         * @param skipResetSub
         * @param field
         */
        self.onChangeMainClassification = function ($event, skipResetSub, field) {
            self.checkNullValues(field);
            if (self.document && self.document.mainClassification) {
                self.loadSubClassificationRecords(true, self.checkMandatory('subClassification'));
                if (!skipResetSub) {
                    self.document.subClassification = null;
                }
            } else {
                self.document.subClassification = null;
            }
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
            /*$timeout(function () {
                if (fieldType === 'mainClassification' || fieldType === 'subClassification') {
                    self.classifications = angular.copy(self.classificationsCopy);
                } else if (fieldType === 'documentFiles') {
                    self.documentFiles = angular.copy(self.documentFilesCopy);
                }
            })*/
        };


        self.loadMainClassificationRecords = function () {
            if (self.mainClassificationSearchText) {
                classificationService.loadClassificationsPairBySearchText(self.mainClassificationSearchText, self.document.securityLevel, null, false)
                    .then(function (result) {
                        if (result.first.length || result.second.length) {
                            var lookups = {classifications: result.first, ouClassifications: result.second},
                                classificationsUnion = correspondenceService.prepareLookupHierarchy(lookups).classifications;

                            self.classifications = _.uniqBy(self.classifications.concat(classificationsUnion), 'classification.id');
                            self.classificationsCopy = angular.copy(self.classifications);
                        } else {
                            self.classifications = angular.copy(self.classificationsCopy);
                        }
                    })
                    .catch(function (error) {
                        self.classifications = angular.copy(self.classificationsCopy);
                    })
            }
        };

        self.loadSubClassificationRecords = function (skipSearchText, selectFirstValue) {
            if (self.document && self.document.mainClassification && (skipSearchText || self.subClassificationSearchText)) {
                var mainClassification = _.find(self.classifications, function (classification) {
                        return classification.classification.id === self.document.mainClassification.id;
                    }).classification,
                    mainClassificationCopy = _.find(self.classificationsCopy, function (classification) {
                        return classification.classification.id === self.document.mainClassification.id;
                    }).classification;

                classificationService.loadClassificationsPairBySearchText(self.subClassificationSearchText, self.document.securityLevel, self.document.mainClassification, false)
                    .then(function (result) {
                        if (result.first.length || result.second.length) {
                            var lookups = {classifications: result.first, ouClassifications: result.second},
                                classificationsUnion = correspondenceService.prepareLookupHierarchy(lookups, self.document.mainClassification).classifications,
                                subClassifications = [];

                            _.map(classificationsUnion, function (ouClassification) {
                                subClassifications = subClassifications.concat(ouClassification.classification.children);
                                return ouClassification;
                            });

                            self.document.mainClassification.children = _.uniqBy(self.document.mainClassification.children.concat(subClassifications), 'id');
                            mainClassification.children = angular.copy(self.document.mainClassification.children);
                            self.classificationsCopy = angular.copy(self.classifications);
                            if (selectFirstValue) {
                                self.document.subClassification = self.document.mainClassification.children[0];
                            }
                            _appendMissingSubClassification();
                        } else {
                            self.document.mainClassification.children = angular.copy(mainClassificationCopy.children);
                            _appendMissingSubClassification();
                        }
                    })
                    .catch(function (error) {
                        self.document.mainClassification.children = angular.copy(mainClassificationCopy.children);
                    })
            }
        };

        self.loadDocumentFilesRecords = function () {
            if (self.documentFileSearchText) {
                documentFileService.loadDocumentFilesBySearchText(self.documentFileSearchText, self.document.securityLevel, null, false)
                    .then(function (result) {
                        if (result.first.length || result.second.length) {
                            var lookups = {documentFiles: result.first, ouDocumentFiles: result.second},
                                documentFilesUnion = correspondenceService.prepareLookupHierarchy(lookups).documentFiles;

                            self.documentFiles = _.uniqBy(self.documentFiles.concat(documentFilesUnion), 'file.id');
                            self.documentFilesCopy = angular.copy(self.documentFiles);
                        } else {
                            self.documentFiles = angular.copy(self.documentFilesCopy);
                        }
                    })
                    .catch(function (error) {
                        self.documentFiles = angular.copy(self.documentFilesCopy);
                    })
            }
        };


        /**
         * @description Handles the default dropdown behavior of selecting option on keydown inside the search box of dropdown
         * @param $event
         * @param fieldType
         */
        self.handleSearchKeyDown = function ($event, fieldType) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                // if enter key pressed, load from server with search text
                if (code === 13) {
                    if (fieldType === 'mainClassification') {
                        self.loadMainClassificationRecords($event);
                    } else if (fieldType === 'subClassification') {
                        self.loadSubClassificationRecords($event);
                    } else if (fieldType === 'documentFile') {
                        self.loadDocumentFilesRecords($event);
                    }
                }
                // prevent keydown except arrow up and arrow down keys
                else if (code !== 38 && code !== 40) {
                    $event.stopPropagation();
                }
            }
        };

        self.getTranslatedEnableDisableSecurityLevel = function () {
            return self.isSecurityLevelEnabled ? langService.get('disable_security_level') : langService.get('enable_security_level');
        };

        /**
         * @description Checks if the security level is private/personal for given document
         * @returns {boolean}
         */
        self.isPrivateSecurityLevel = function (securityLevel) {
            securityLevel = (securityLevel && securityLevel.hasOwnProperty('lookupKey')) ? securityLevel.lookupKey : securityLevel;
            return securityLevel === 4;
        };

        self.isShowSecurityLevelInput = function () {
            return self.document.hasVsId() && !self.isSecurityLevelEnabled;
        };

        self.isShowSecurityLevelDDL = function () {
            return !self.document.hasVsId() || self.isSecurityLevelEnabled
        };

        self.isShowSecurityLevelCheckbox = function () {
            var hasPermission = employeeService.hasPermissionTo('CHANGE_BOOK_SECURITY_LEVEL') && !self.disableProperties;
            if (!hasPermission) {
                return false;
            }
            var allowedActionsList = ["editafterexport", "editafterapproved", "duplicateversion", "receive", "review", "editafterreturng2g", "user-inbox"];
            if (self.action && self.action.toLowerCase() === 'search-screen') {
                // allowed to edit security level (if not exported and docRegOuId === currentLoggedInUserRegOuId)
                hasPermission = self.document.getInfo().docStatus !== 25
                    && (generator.getNormalizedValue(self.document.registryOU, 'id') === employeeService.getEmployee().getRegistryOUID());
            } else {
                hasPermission = self.action && allowedActionsList.indexOf(self.action.toLowerCase()) !== -1;
            }
            return hasPermission;
        };

        /**
         * @description Check if serial number(docFullSerial) field can be displayed.
         * If displayed, it is mandatory
         * @returns {boolean|*}
         */
        self.isShowDocFullSerial = function () {
            if (!self.document.vsId && self.employee.isBacklogMode()) {
                self.document.isMigrated = true;
                return true;
            } else {
                return self.employee.isBacklogMode() && self.document.isMigrated;
            }
        };

        self.checkNullValues = function (field) {
            if (!field)
                return;

            if (!field.$modelValue && self.checkMandatory(field.$name)) {
                field.$setValidity('required', false);
            }
        }
    });
};
