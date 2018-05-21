module.exports = function (app) {
    app.controller('managePropertiesSearchDirectiveCtrl', function ($scope,
                                                                    lookupService,
                                                                    employeeService,
                                                                    organizationService,
                                                                    documentTypeService,
                                                                    classificationService,
                                                                    documentFileService,
                                                                    $timeout,
                                                                    toast,
                                                                    correspondenceService,
                                                                    LangWatcher,
                                                                    DocumentStatus,
                                                                    documentStatusService,
                                                                    cmsTemplate,
                                                                    dialog,
                                                                    correspondenceSiteTypeService,
                                                                    generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'managePropertiesSearchDirectiveCtrl';
        LangWatcher($scope);
        var properties = [];
        self.document = null;
        self.maxCreateDate = new Date();


        // all security level
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.correspondenceSiteTypes = correspondenceSiteTypeService.correspondenceSiteTypes;
        self.docStatuses = angular.copy(documentStatusService.documentStatuses);
        self.docStatuses.unshift(new DocumentStatus({arName: 'الكل', enName: 'All'}));
        self.followupStatuses = lookupService.returnLookups(lookupService.followupStatus);

        self.approvers = [];

        self.documentFiles = [];
        self.classifications = [];

        /*Types options for the type drop down*/
        self.typeOptions = [
            {
                value: 0,
                key: "personal"
            },
            {
                value: 1,
                key: "departmental"
            }
        ];

        self.paperElectronicTypes = [
            {
                value: null,
                key: 'all'
            },
            {
                value: 0,
                key: "electronic"
            },
            {
                value: 1,
                key: "paper"
            }
        ];
        var required = {};


        self.years = function () {
            var currentYear = new Date().getFullYear(), years = ['All'];
            var lastYearForRange = currentYear - 10;
            while (lastYearForRange <= currentYear) {
                years.push(currentYear--);
            }
            return years;
        };

        $timeout(function () {
            // all system organizations
            self.organizations = self.centralArchives ? self.centralArchives : organizationService.organizations;
            // all document types
            self.documentTypes = correspondenceService.getLookup(self.document.docClassName, 'docTypes');
            self.securityLevels = correspondenceService.getLookup(self.document.docClassName, 'securityLevels');
            properties = lookupService.getPropertyConfigurations(self.document.docClassName);
            _getClassifications(false);
            _getDocumentFiles(false);

            self.defaultEntityTypes = correspondenceService.getDefaultEntityTypesForDocumentClass(self.document.docClassName);
            self.entityTypes = correspondenceService.getCustomEntityTypesForDocumentClass(self.document.docClassName);

            self.entityTypesArray = self.defaultEntityTypes.concat(self.entityTypes);

            self.document.approveDateFrom = null;
            self.document.approveDateTo = null;
        });
        // current employee
        self.employee = employeeService.getEmployee();
        // for sub organizations
        self.subOrganizations = [];
        // required fields for the current document class
        self.required = {};

        // need  timeout here to start init each property mandatory.
        $timeout(function () {
            //TODO: Don't delete this map. Uncomment it when need to check mandatory fields from property configuration.
            /*_.map(properties, function (item) {
                self.required[item.symbolicName.toLowerCase()] = item.isMandatory;
            });*/
            /* Year is mandatory always */
            self.required.year = true;
        });

        /**
         * @description Checks if field is required or not
         * @param fieldName
         * @returns {*}
         */
        self.checkMandatory = function (fieldName) {
            return self.required[fieldName.toLowerCase()];
        };


        /**
         * @description Set the selected year on changing the value
         * @param resetDate
         * @param $event
         */
        self.setSelectedYear = function (resetDate, $event) {
            self.selectedYear = self.document.year;
            if (resetDate) {
                self.document.docDateFrom = null;
                self.document.docDateTo = null;
                self.docDateFromLabel = null;
                self.docDateToLabel = null;
            }
            if (self.selectedYear === 'All') {
                self.required.docDateFrom = true;
                self.required.docDateTo = true;

                self.changeYearRange();
            }
            else {
                self.required.docDateFrom = false;
                self.required.docDateTo = false;

                var docDateFromCopy = self.selectedYear + '-01-01 00:00:00.000';
                var docDateToCopy = self.docDateToLabel = self.selectedYear + '-12-31 23:59:59.999';

                self.document.docDateFrom = new Date(docDateFromCopy);
                self.document.docDateTo = new Date(docDateToCopy);
                self.docDateFromLabel = generator.convertDateToString(docDateFromCopy);
                self.docDateToLabel = generator.convertDateToString(docDateToCopy);
            }
        };

        self.changeYearRange = function () {
            return dialog
                .showDialog({
                    template: cmsTemplate.getPopup('search-doc-date-range'),
                    controller: 'searchDocDateRangePopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        document: self.document,
                        year: self.selectedYear
                    }
                }).then(function (result) {
                    self.document.docDateFrom = result.dateFrom;
                    self.document.docDateTo = result.dateTo;

                    self.docDateFromLabel = result.dateFromLabel;
                    self.docDateToLabel = result.dateToLabel;
                })
                .catch(function (result) {
                    self.document.docDateFrom = result.dateFrom;
                    self.document.docDateTo = result.dateTo;
                    if (!(self.document.docDateFrom && self.document.docDateTo)) {
                        self.document.year = self.selectedYear = null;

                        self.required.docDateFrom = false;
                        self.required.docDateTo = false;
                    }
                    self.docDateFromLabel = result.dateFromLabel;
                    self.docDateToLabel = result.dateToLabel;

                });
        };

        /**
         * @description Check if the date from, date to, change date range will show or not
         * @returns {boolean}
         */
        self.checkShowDateFields = function () {
            return !!(self.document.year && self.docDateFromLabel && self.docDateToLabel);
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
         * @description on security level changed, get the classifications, document files
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

        /**
         * @description When file is changed, get the file code and file serial
         * @param file
         */
        self.onFileChange = function (file) {
            var ouDocumentFile = _.find(self.documentFiles, function (ouDocumentFile) {
                return file && ouDocumentFile.file.id === file.id;
            });
            if (ouDocumentFile) {
                self.document.fileCode = ouDocumentFile.code || self.document.fileCode;
                self.document.fileSerial = ouDocumentFile.serial || self.document.fileSerial;
            }
        };

        /**
         * @description When the file code changed, get the file
         */
        self.onFileCodeChanged = function () {
            var file = _.find(self.documentFiles, function (ouDocumentFile) {
                return (ouDocumentFile.code + '').trim() === (self.document.fileCode + '').trim();
            });

            if (file)
                self.document.fileId = file.file;
        };

        // if we have source form
        $timeout(function () {
            self.sourceForm = $scope.docSearchForm;
        });

        $scope.$watch(function () {
            return self.model;
        }, function (newVal) {
            if (newVal)
                self.sourceModel = newVal;
        });


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
            return (self.document.hasDocumentClass('internal') || (self.document.hasDocumentClass('outgoing') && !self.document.addMethod));

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

        /**
         * @description Gets the main correspondence site and sub correspondence site based on selected correspondence site type.
         * @param resetSites
         * @param $event
         */
        self.getCorrespondenceSites = function (resetSites, $event) {
            if (resetSites) {
                self.document.sitesInfoTo = null;
                self.document.sitesInfoCC = null;
            }
            if (self.document.selectedCorrSiteType || !resetSites) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('manage-correspondence-sites-search'),
                        controller: 'manageCorrespondenceSitesSearchPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            selectedSiteType: self.document.selectedCorrSiteType,
                            document: self.document
                        }
                    }).then(function (result) {
                        self.document.selectedCorrSiteType = result.siteType;
                        self.document = result.document;
                        self.mainSiteLabel = result.mainSiteLabel;
                        self.subSiteLabel = result.subSiteLabel;
                    })
                    .catch(function (result) {
                        self.document.selectedCorrSiteType = result.siteType;
                        self.document = result.document;
                        if (!(self.document.selectedCorrSiteType && (result.mainSiteLabel || result.subSiteLabel))) {
                            self.document.selectedCorrSiteType = null;
                        }
                        self.mainSiteLabel = result.mainSiteLabel;
                        self.subSiteLabel = result.subSiteLabel;
                    });
            }
        };

        /**
         * @description Opens the popup to fill selected entity type values
         * @param resetValues
         * @param $event
         */
        self.openEntityTypePopup = function (resetValues, $event) {
            if (resetValues)
                self.document.linkedEntities = null;
            if (self.document.selectedEntityType) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('manage-document-entities-search'),
                        controller: 'manageDocumentEntitiesSearchPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            documentClass: self.document.docClassName,
                            linkedEntity: self.document.linkedEntities,
                            selectedEntityType: self.document.selectedEntityType,
                            formValid: !!self.document.linkedEntities
                        }
                    }).then(function (result) {
                        self.document.linkedEntities = result.linkedEntity;
                        self.document.selectedEntityType = result.selectedEntityType;
                        self.linkedEntityValueName = result.linkedEntity.getName();
                    })
                    .catch(function (result) {
                        self.document.selectedEntityType = result.linkedEntity ? result.selectedEntityType : null;
                        self.document.linkedEntities = result.linkedEntity;
                        self.linkedEntityValueName = result.linkedEntity ? result.linkedEntity.getName() : '';
                    });
            }
            else {
                self.document.linkedEntities = null;
                self.document.selectedEntityType = null;
                self.linkedEntityValueName = '';
            }
        };


        self.onChangeApprover = function ($event) {
            self.document.approveDateFrom = null;
            self.document.approveDateTo = null;
        };

        self.onChangeAddMethod = function ($event) {
            if (self.document.addMethod === 1) {
                self.document.approvers = null;
                self.document.approveDateFrom = null;
                self.document.approveDateTo = null;
            }
        }


    });
};