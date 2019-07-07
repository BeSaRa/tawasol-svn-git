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
                                                              correspondenceService,
                                                              LangWatcher,
                                                              gridService,
                                                              classificationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'managePropertiesDirectiveCtrl';
        LangWatcher($scope);
        var properties = [];
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
                    self.documentFilesCopy = angular.copy(self.documentFiles);
                });
            } else {
                self.documentFiles = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'documentFiles'));
                self.documentFiles = _displayCorrectDocumentFiles(self.documentFiles);
                self.documentFilesCopy = angular.copy(self.documentFiles);
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
                    self.classificationsCopy = angular.copy(self.classifications);
                });
            } else {
                self.classifications = angular.copy(correspondenceService.getLookup(self.document.docClassName, 'classifications'));
                self.classifications = _displayCorrectClassifications(self.classifications);
                self.classificationsCopy = angular.copy(self.classifications);
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

            if (self.document.hasDocumentClass('outgoing') && self.document.isPrivateSecurityLevel())
                self.document.isComposite = false;

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
                }).catch(function (error) {
                toast.error(error);
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

        $scope.$watch(function () {
            return self.isNewDocument;
        }, function (newVal) {
            if (newVal)
                _selectFirstOptionForRequired();
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
                    }
                }
            }
            self.isNewDocument = false;
        }

        $timeout(function () {
            _selectFirstOptionForRequired();
        });


        /**
         * enable edit security level when its on action list
         * @returns {*|boolean}
         */
        self.enabledSecurityLevel = function () {
            var actions = ["editafterexport", "duplicateversion", "receive", "review"];

            return self.action && actions.indexOf(self.action.toLowerCase()) !== -1;
        };

        /**
         * @description Set the sub classification on change of main classification
         * @param $event
         */
        self.onChangeMainClassification = function ($event) {
            if (self.document.mainClassification) {
                if (self.document.mainClassification && self.document.mainClassification.hasOwnProperty('children')
                    && self.document.mainClassification.children && self.document.mainClassification.children.length
                    && self.checkStatus('subClassification') && self.checkMandatory('subClassification')
                ) {
                    self.document.subClassification = self.document.mainClassification.children[0];
                }
            } else {
                self.document.subClassification = null;
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


        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
            $timeout(function () {
                if (fieldType === 'mainClassification' || fieldType === 'subClassification') {
                    self.classifications = angular.copy(self.classificationsCopy);
                } else if (fieldType === 'documentFiles') {
                    self.documentFiles = angular.copy(self.documentFilesCopy);
                }
            })
        };


        var _filterSearchMainClassifications = function () {
            var searchResult = gridService.searchGridData({
                searchText: self.mainClassificationSearchText,
                searchColumns: {
                    arName: langService.current === 'ar' ? 'classification.arName' : '',
                    enName: langService.current === 'en' ? 'classification.enName' : '',
                }
            }, self.classificationsCopy);
            if (searchResult && searchResult.length) {
                self.classifications = searchResult;
            } else {
                if (self.mainClassificationSearchText) {
                    classificationService.loadClassificationsPairBySearchText(self.mainClassificationSearchText, self.document.securityLevel, null, false)
                        .then(function (result) {
                            if (result.first.length || result.second.length) {
                                var lookups = {classifications: result.first, ouClassifications: result.second},
                                    classificationsUnion = correspondenceService.prepareLookupHierarchy(lookups).classifications;

                                self.classifications = self.classifications.concat(classificationsUnion);
                                self.classificationsCopy = self.classificationsCopy.concat(classificationsUnion);
                                self.filterDropdownRecords(null, 'mainClassification', true);
                            } else {
                                self.classifications = [];
                            }
                        })
                        .catch(function (error) {
                            self.classifications = angular.copy(self.classificationsCopy);
                        })
                }
            }
        };

        var _filterSearchSubClassifications = function () {
            if (self.document.mainClassification) {
                var mainClassification = _.find(self.classifications, function (classification) {
                        return classification.classification.id === self.document.mainClassification.id;
                    }).classification,
                    mainClassificationCopy = _.find(self.classificationsCopy, function (classification) {
                        return classification.classification.id === self.document.mainClassification.id;
                    }).classification,
                    subClassificationsCopy = mainClassificationCopy.children;

                var searchResult = gridService.searchGridData({
                    searchText: self.subClassificationSearchText,
                    searchColumns: {
                        arName: langService.current === 'ar' ? 'arName' : '',
                        enName: langService.current === 'en' ? 'enName' : '',
                    }
                }, subClassificationsCopy);
                if (searchResult && searchResult.length) {
                    self.document.mainClassification.children = searchResult;
                } else {
                    if (self.subClassificationSearchText) {
                        classificationService.loadClassificationsPairBySearchText(self.subClassificationSearchText, self.document.securityLevel, self.document.mainClassification, false)
                            .then(function (result) {
                                var lookups = {classifications: result.first, ouClassifications: result.second},
                                    classificationsUnion = correspondenceService.prepareLookupHierarchy(lookups, self.document.mainClassification).classifications,
                                    subClassifications = [];

                                _.map(classificationsUnion, function (ouClassification) {
                                    subClassifications = subClassifications.concat(ouClassification.classification.children);
                                    return ouClassification;
                                });

                                if (subClassifications && subClassifications.length) {
                                    self.document.mainClassification.children = self.document.mainClassification.children.concat(subClassifications);
                                    mainClassification.children = mainClassification.children.concat(subClassifications);

                                    self.classificationsCopy = angular.copy(self.classifications);
                                    self.filterDropdownRecords(null, 'subClassification');
                                } else {
                                    self.document.mainClassification.children = [];
                                }
                            })
                            .catch(function (error) {
                                self.document.mainClassification.children = angular.copy(subClassificationsCopy);
                            })
                    }
                }
            }
        };


        var _filterSearchDocumentFiles = function () {
            var searchResult = gridService.searchGridData({
                searchText: self.documentFileSearchText,
                searchColumns: {
                    arName: langService.current === 'ar' ? 'file.arName' : '',
                    enName: langService.current === 'en' ? 'file.enName' : '',
                }
            }, self.documentFilesCopy);
            if (searchResult && searchResult.length) {
                self.documentFiles = searchResult;
            } else {
                if (self.documentFileSearchText) {
                    documentFileService.loadDocumentFilesBySearchText(self.documentFileSearchText, self.document.securityLevel, null, false)
                        .then(function (result) {
                            var lookups = {documentFiles: result.first, ouDocumentFiles: result.second},
                                documentFilesUnion = correspondenceService.prepareLookupHierarchy(lookups).documentFiles;
                            if (documentFilesUnion && documentFilesUnion.length) {
                                self.documentFiles = self.documentFiles.concat(documentFilesUnion);
                                self.documentFilesCopy = self.documentFilesCopy.concat(documentFilesUnion);
                                self.filterDropdownRecords(null, 'documentFile');
                            } else {
                                self.documentFiles = [];
                            }
                        })
                        .catch(function (error) {
                            self.documentFiles = angular.copy(self.documentFilesCopy);
                        })
                }
            }
        };


        /**
         * @description filter the dropdown with searchText or request service if searched record not found
         * @param $event
         * @param fieldType
         */
        self.filterDropdownRecords = function ($event, fieldType) {
            $timeout(function () {
                if (fieldType === 'mainClassification') {
                    _filterSearchMainClassifications();
                } else if (fieldType === 'subClassification') {
                    _filterSearchSubClassifications()
                } else if (fieldType === 'documentFile') {
                    _filterSearchDocumentFiles();
                }
            })
        };

        self.getTranslatedEnableDisableSecurityLevel = function(){
            return self.isSecurityLevelEnabled ? langService.get('disable_security_level') : langService.get('enable_security_level');
        };


        /**
         * @description Prevent the default dropdown behavior of selecting option on keydown inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };
    });
};
