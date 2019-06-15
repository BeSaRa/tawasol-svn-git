module.exports = function (app) {
    app.controller('managePropertiesSearchDirectiveCtrl', function ($scope,
                                                                    lookupService,
                                                                    employeeService,
                                                                    organizationService,
                                                                    documentTypeService,
                                                                    $timeout,
                                                                    toast,
                                                                    _,
                                                                    correspondenceService,
                                                                    LangWatcher,
                                                                    langService,
                                                                    DocumentStatus,
                                                                    documentStatusService,
                                                                    cmsTemplate,
                                                                    dialog,
                                                                    rootEntity,
                                                                    correspondenceSiteTypeService,
                                                                    generator,
                                                                    classificationService,
                                                                    documentFileService,
                                                                    gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'managePropertiesSearchDirectiveCtrl';
        LangWatcher($scope);
        var properties = [];
        self.document = null;
        self.maxCreateDate = new Date();
        self.emptyResults = false;

        // all security level
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.correspondenceSiteTypes = correspondenceSiteTypeService.correspondenceSiteTypes;
        /*self.docStatuses = angular.copy(documentStatusService.documentStatuses);*/
        self.followupStatuses = lookupService.returnLookups(lookupService.followupStatus);

        self.approvers = [];
        self.subOrganizations = [];

        self.documentFiles = [];
        self.classifications = [];

        self.mainClassificationSearchText = '';
        self.subClassificationSearchText = '';
        self.documentFileSearchText = '';

        self.displayFollowUpDates = false;

        /*Types options for the type drop down*/
        self.typeOptions = [
            {
                value: null,
                key: 'all'
            },
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

        self.getYears = function () {
            var currentYear = new Date().getFullYear(), years = ['All'];
            self.document.year = currentYear;
            var lastYearForRange = 2000;
            while (lastYearForRange <= currentYear) {
                years.push(currentYear--);
            }
            self.yearsList = years;
            self.setSelectedYear(true);
        };

        // required fields for the current document class
        self.required = {};
        // current employee
        self.employee = employeeService.getEmployee();

        $timeout(function () {
            // all system organizations
            self.organizations = self.centralArchives ? self.centralArchives : organizationService.organizations;
            // all document types
            var docClass = self.document.docClassName;
            var dummySearchDocClass = self.document.dummySearchDocClass.toLowerCase();
            if (dummySearchDocClass === 'correspondence') {
                self.documentTypes = correspondenceService.getLookupUnionByLookupName('docTypes');
                //self.securityLevels = generator.getSelectedCollectionFromResult(lookupService.returnLookups(lookupService.securityLevel), employeeService.getEmployee().organization.securityLevels, 'lookupKey');
            } else if (dummySearchDocClass === 'outgoingincoming') {
                self.documentTypes = correspondenceService.getLookup(docClass, 'docTypes');
                //self.securityLevels = rootEntity.getGlobalSettings().securityLevels;
            } else {
                self.documentTypes = correspondenceService.getLookup(docClass, 'docTypes');
                //self.securityLevels = correspondenceService.getLookup(docClass, 'securityLevels');
            }
            self.securityLevels = rootEntity.getGlobalSettings().securityLevels;
            properties = lookupService.getPropertyConfigurations(docClass);
            _getClassifications(false);
            _getDocumentFiles(false);

            self.defaultEntityTypes = correspondenceService.getDefaultEntityTypesForDocumentClass(docClass.toLowerCase() === 'correspondence' ? 'Outgoing' : docClass);
            self.entityTypes = correspondenceService.getCustomEntityTypesForDocumentClass(docClass.toLowerCase() === 'correspondence' ? 'Outgoing' : docClass);

            self.entityTypesArray = self.defaultEntityTypes.concat(self.entityTypes);

            _.map(properties, function (item) {
                self.required[item.symbolicName.toLowerCase()] = {
                    isMandatory: null, //item.isMandatory,
                    status: item.status
                };
            });
            /* Year is mandatory always */
            self.required.year = {
                isMandatory: true,
                status: true
            };

            self.getYears();

        });
        // for sub organizations
        self.subOrganizations = [];


        self.checkMandatory = function (fieldName) {
            // year is always required
            if (self.document.dummySearchDocClass === 'correspondence' || self.document.dummySearchDocClass === 'outgoingIncoming') {
                return fieldName === 'year';
            }
            return self.required[fieldName.toLowerCase()] && self.required[fieldName.toLowerCase()].isMandatory;
        };

        self.checkStatus = function (fieldName) {
            // year is always required
            if (self.document.dummySearchDocClass === 'correspondence' || self.document.dummySearchDocClass === 'outgoingIncoming') {
                return true;
            }
            return self.required[fieldName.toLowerCase()] && self.required[fieldName.toLowerCase()].status;
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
                if (!self.required.hasOwnProperty('docDateFrom'))
                    self.required.docDateFrom = {};
                self.required.docDateFrom.isMandatory = true;
                if (!self.required.hasOwnProperty('docDateTo'))
                    self.required.docDateTo = {};
                self.required.docDateTo.isMandatory = true;

                self.changeYearRange();
            } else {
                if (!self.required.hasOwnProperty('docDateFrom'))
                    self.required.docDateFrom = {};
                self.required.docDateFrom.isMandatory = false;
                if (!self.required.hasOwnProperty('docDateTo'))
                    self.required.docDateTo = {};
                self.required.docDateTo.isMandatory = false;

                self.document.docDateFrom = new Date(self.selectedYear, 0, 1, 0, 0, 0, 0);
                self.document.docDateTo = (self.maxCreateDate.getFullYear() === self.selectedYear) ? self.maxCreateDate : new Date(self.selectedYear, 11, 31, 23, 59, 59, 999);

                self.docDateFromLabel = generator.convertDateToString(self.document.docDateFrom);
                self.docDateToLabel = generator.convertDateToString(self.document.docDateTo);

            }
        };

        self.changeYearRange = function () {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('search-doc-date-range'),
                    controller: 'searchDocDateRangePopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    escapeToClose: false,
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
                        self.document.year = null;
                        self.selectedYear = null;

                        if (!self.required.hasOwnProperty('docDateFrom'))
                            self.required.docDateFrom = {};
                        self.required.docDateFrom.isMandatory = false;
                        if (!self.required.hasOwnProperty('docDateTo'))
                            self.required.docDateTo = {};
                        self.required.docDateTo.isMandatory = false;
                    }
                    self.docDateFromLabel = result.dateFromLabel;
                    self.docDateToLabel = result.dateToLabel;
                    self.selectedYear = result.dateFrom.getFullYear();
                    self.document.year = result.dateFrom.getFullYear();
                });
        };

        /**
         * @description Check if the date from, date to, change date range will show or not
         * @returns {boolean}
         */
        self.checkShowDateFields = function () {
            return self.checkMandatory('year') && !!(self.document.year && self.docDateFromLabel && self.docDateToLabel);
        };

        /**
         * @description to check if the given securityLevel included or not.
         * @param securityLevel
         * @param securityLevels
         * @private
         */
        function _securityLevelExist(securityLevel, securityLevels) {
            var id = securityLevel && securityLevel.hasOwnProperty('id') ? securityLevel.id : securityLevel;
            return _.find(securityLevels, function (item) {
                return item.id === id || !id;
            });
        }

        /**
         * @description get available documentFiles for the document by security level.
         * @param timeout
         * @returns {*}
         * @private
         */
        function _getDocumentFiles(timeout) {
            var docClass = self.document.docClassName.toLowerCase() === 'correspondence' ? 'outgoing' : self.document.docClassName;
            if (timeout) {
                return $timeout(function () {
                    self.documentFiles = angular.copy(correspondenceService.getLookup(docClass, 'documentFiles'));
                    self.documentFiles = _displayCorrectDocumentFiles(self.documentFiles);
                    self.documentFilesCopy = angular.copy(self.documentFiles);
                });
            } else {
                self.documentFiles = angular.copy(correspondenceService.getLookup(docClass, 'documentFiles'));
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
            var docClass = self.document.docClassName.toLowerCase() === 'correspondence' ? 'outgoing' : self.document.docClassName;
            if (timeout) {
                return $timeout(function () {
                    self.classifications = angular.copy(correspondenceService.getLookup(docClass, 'classifications'));
                    self.classifications = _displayCorrectClassifications(self.classifications);
                    self.classificationsCopy = angular.copy(self.classifications);
                });
            } else {
                self.classifications = angular.copy(correspondenceService.getLookup(docClass, 'classifications'));
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
            _getClassifications(true);
            _getDocumentFiles(true);
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
            // console.log(organizationId);
            if (!organizationId)
                return;

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
                self.document.sitesInfoIncoming = null;
            }
            if (self.document.siteType || !resetSites) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('manage-correspondence-sites-search'),
                        controller: 'manageCorrespondenceSitesSearchPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            selectedSiteType: self.document.siteType,
                            document: self.document
                        }
                    }).then(function (result) {
                        self.document.siteType = result.siteType;
                        self.document = result.document;
                        self.mainSiteLabel = result.mainSiteLabel;
                        self.subSiteLabel = result.subSiteLabel;
                    })
                    .catch(function (result) {
                        self.document.siteType = result.siteType;
                        self.document = result.document;
                        if (!(self.document.siteType && (result.mainSiteLabel || result.subSiteLabel))) {
                            self.document.siteType = null;
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
                        templateUrl: cmsTemplate.getPopup('manage-document-entities-search'),
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
            } else {
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
        };

        /**
         * @description Get the allowed max and min values for the serial number and values to be displayed in error
         * @param field
         * @param minOrMax
         * @returns {*}
         */
        self.getMinMaxSerialNumberValues = function (field, minOrMax) {
            if (field === 'from') {
                if (minOrMax === 'min') {
                    return {
                        value: 1,
                        errorValue: 0
                    };
                } else if (minOrMax === 'max') {
                    if (self.document.serialNoTo) {
                        return {
                            value: Number(self.document.serialNoTo) - 1,
                            errorValue: Number(self.document.serialNoTo)
                        };
                    }
                }
            } else if (field === 'to') {
                if (minOrMax === 'min') {
                    if (self.document.serialNoFrom) {
                        return {
                            value: Number(self.document.serialNoFrom) + 1,
                            errorValue: self.document.serialNoFrom
                        };
                    }
                    return {
                        value: 2,
                        errorValue: 1
                    }
                } else {

                }
            }
        };

        self.onRegistryChanged = function () {
            if (!self.document.registryOU)
                return false;

            self.subOrganizations = [];
            organizationService
                .loadChildrenOrganizations(self.document.registryOU)
                .then(function (result) {
                    if (!self.employee.hasPermissionTo('SEARCH_IN_ALL_OU') && self.employee.isInDepartment()) {
                        result.push(angular.copy(self.employee.userOrganization));
                    } else {
                        result.unshift(angular.copy(organizationService.getOrganizationById(self.document.registryOU)));
                        self.document.ou = null;
                    }
                    self.subOrganizations = result;
                });
        };

        /**
         * @description Set the formatted serial number for search on changing the serial number from and to values
         * @param $event
         */
        self.setSerialNumber = function ($event) {
            if (self.document.serialNoFrom && self.document.serialNoTo)
                self.document.docSerial = self.document.serialNoFrom + ',' + self.document.serialNoTo;
            else
                self.document.docSerial = null;
        };

        self.checkFollowUpStatusValue = function () {
            self.displayFollowUpDates = !!_.find(self.document.followupStatus, function (item) {
                return item.lookupStrKey === 'NEED_REPLY';
            });
            // empty the follow up dates in case there is no 'NEED_REPLY' Selected from followup status .
            if (!self.displayFollowUpDates) {
                self.document.followUpTo = null;
                self.document.followUpFrom = null;
            }
        };
        // this will work one time
        var watcher = $scope.$watch(function () {
            return self.loadSubOrganizations;
        }, function (newVal) {
            if (newVal) {
                self.onRegistryChanged();
                self.loadSubOrganizations = false;
                watcher();
            }
        });

        $scope.$watch(function () {
            return self.emptyResults;
        }, function (newValue, oldValue) {
            if (newValue) {
                self.getYears();
                $timeout(function () {
                    _getClassifications(true);
                    _getDocumentFiles(true);
                    self.emptyResults = false;
                })

            }
        });

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
                    classificationService.loadClassificationsPairBySearchText(self.mainClassificationSearchText, self.document.securityLevel, null, true)
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
                        classificationService.loadClassificationsPairBySearchText(self.subClassificationSearchText, self.document.securityLevel, self.document.mainClassification, true)
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
                    documentFileService.loadDocumentFilesBySearchText(self.documentFileSearchText, self.document.securityLevel, null, true)
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
