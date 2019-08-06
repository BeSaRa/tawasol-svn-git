module.exports = function (app) {
    app.controller('managePropertiesSimpleDirectiveCtrl', function ($scope,
                                                                    lookupService,
                                                                    langService,
                                                                    employeeService,
                                                                    organizationService,
                                                                    documentTypeService,
                                                                    //documentFileService,
                                                                    $timeout,
                                                                    toast,
                                                                    customValidationService,
                                                                    correspondenceService,
                                                                    LangWatcher,
                                                                    generator,
                                                                    moment,
                                                                    $stateParams,
                                                                    classificationService,
                                                                    gridService,
                                                                    _) {
        'ngInject';
        var self = this;
        self.controllerName = 'managePropertiesDirectiveSimpleCtrl';
        LangWatcher($scope);
        var properties = [];
        self.document = null;
        self.maxCreateDate = moment(new Date()).format(generator.defaultDateFormat);

        self.defaultDateFormat = generator.defaultDateFormat;
        // all priority level
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.documentFiles = [];
        self.classifications = [];

        self.mainClassificationSearchText = '';
        self.subClassificationSearchText = '';
        self.registryOUSearchText = '';
        self.registrySectionSearchText = '';
        self.ouSearchText = '';

        $timeout(function () {
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
            properties = lookupService.getPropertyConfigurations(self.document.docClassName);
            _getClassifications(false);
            _getDocumentFiles(false);

            if (self.document && self.document.getInfo().documentClass.toLowerCase() === 'incoming' && !self.document.refDocDate) {
                self.document.refDocDate = self.document.docDate;
            }
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
                self.required[item.symbolicName.toLowerCase()] = item.isMandatory;
            });
        });

        self.checkMandatory = function (fieldName) {
            return self.required[fieldName.toLowerCase()];
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

        // self.shortcut = {
        //     /**
        //      * add new document as shortcut.
        //      * @param $event
        //      */
        //     addNewDocumentType: function ($event) {
        //         documentTypeService
        //             .controllerMethod
        //             .documentTypeAdd($event)
        //             .then(function (documentType) {
        //                 toast.success(langService.get('add_success').change({name: documentType.getNames()}));
        //                 self.documentTypes.unshift(documentType);
        //                 self.document.docType = documentType;
        //             });
        //     },
        //     /**
        //      * add new documentFile as shortcut.
        //      * @param $event
        //      */
        //     addNewDocumentFile: function ($event) {
        //         documentFileService
        //             .controllerMethod
        //             .documentFileAdd(null, $event)
        //             .then(function (documentFile) {
        //                 toast.success(langService.get('add_success').change({name: documentFile.getNames()}));
        //                 self.documentFiles.unshift(documentFile);
        //                 self.document.fileId = documentFile;
        //             });
        //     }
        // };


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
            if (self.document.hasVsId() || !self.employee.inCentralArchive()) {
                return true;
            }
            // if this document new and internal or outgoing electronic disable the select organization.
            return !!(self.document.hasDocumentClass('internal') || (self.document.hasDocumentClass('outgoing') && !self.document.addMethod));

        };
        /**
         * @description on registry change.
         * @param organizationId
         */
        self.onRegistryChange = function (organizationId) {
            if (!organizationId)
                return;
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
                });
        };

        self.showRegistryUnit = function () {
            return self.registryOrganizations && self.registryOrganizations.length && employeeService.isCentralArchive() && self.document && self.document.addMethod && (self.document.classDescription.toLowerCase() === 'outgoing' || self.document.classDescription.toLowerCase() === 'incoming');
        };

        self.checkIncomingDateValid = function () {
            if (self.document.hasDocumentClass('incoming')) {
                var docDate = self.document.docDate,
                    refDocDate = self.document.refDocDate,
                    docDateValid = customValidationService.validateInput(docDate, 'Date'),
                    refDocDateValid = customValidationService.validateInput(refDocDate, 'Date');

                if ((docDate && docDateValid) && (refDocDate && refDocDateValid)) {
                    if (new Date(docDate).getTime() < new Date(refDocDate).getTime())
                        self.document.refDocDate = docDate;
                } else {
                    self.document.refDocDate = null;
                }
            }
        };

        self.getMaxRefDocDateErrorMsg = function () {
            if (self.document.docDate && customValidationService.validateInput(self.document.docDate, 'Date'))
                return generator.convertDateToString(self.document.docDate, generator.defaultDateFormat);
            return self.maxCreateDate;
        };

        /**
         * @description make first option selected by default if dropdown required
         * @private
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
                    if (self.checkMandatory(field.name) && options && options.length) {
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
                }
            })
        };


        self.loadMainClassificationRecords = function () {
            if (self.mainClassificationSearchText) {
                classificationService.loadClassificationsPairBySearchText(self.mainClassificationSearchText, self.document.securityLevel, null, false)
                    .then(function (result) {
                        if (result.first.length || result.second.length) {
                            var lookups = {classifications: result.first, ouClassifications: result.second},
                                classificationsUnion = correspondenceService.prepareLookupHierarchy(lookups).classifications;

                            self.classifications = self.classifications.concat(classificationsUnion);
                            self.classificationsCopy = self.classificationsCopy.concat(classificationsUnion);
                        } else {
                            self.classifications = angular.copy(self.classificationsCopy);
                        }
                    })
                    .catch(function (error) {
                        self.classifications = angular.copy(self.classificationsCopy);
                    })
            }
        };

        self.loadSubClassificationRecords = function () {
            if (self.document.mainClassification) {
                var mainClassification = _.find(self.classifications, function (classification) {
                        return classification.classification.id === self.document.mainClassification.id;
                    }).classification,
                    mainClassificationCopy = _.find(self.classificationsCopy, function (classification) {
                        return classification.classification.id === self.document.mainClassification.id;
                    }).classification,
                    subClassificationsCopy = mainClassificationCopy.children;


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
                            } else {
                                self.document.mainClassification.children = angular.copy(subClassificationsCopy);
                            }
                        })
                        .catch(function (error) {
                            self.document.mainClassification.children = angular.copy(subClassificationsCopy);
                        })
                }
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
                    }
                }
                // prevent keydown except arrow up and arrow down keys
                else if (code !== 38 && code !== 40) {
                    $event.stopPropagation();
                }
            }
        };
    });
};
