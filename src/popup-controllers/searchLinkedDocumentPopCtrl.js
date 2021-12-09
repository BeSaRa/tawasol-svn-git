module.exports = function (app) {
    app.controller('searchLinkedDocumentPopCtrl', function (lookupService,
                                                            documentFileService,
                                                            rootEntity,
                                                            langService,
                                                            viewCallback,
                                                            dialog,
                                                            $filter,
                                                            excludeVsId,
                                                            viewDocumentService,
                                                            multiSelect,
                                                            correspondenceService,
                                                            classificationService,
                                                            Correspondence,
                                                            $timeout,
                                                            _,
                                                            generator,
                                                            employeeService,
                                                            isAdminSearch,
                                                            gridService,
                                                            organizations,
                                                            correspondenceSiteTypes,
                                                            correspondenceViewService,
                                                            Site_Search,
                                                            Lookup) {
        'ngInject';
        var self = this,
            noneLookup = new Lookup({
                defaultEnName: langService.getByLangKey('none', 'en'),
                defaultArName: langService.getByLangKey('none', 'ar')
            });
        self.controllerName = 'searchLinkedDocumentPopCtrl';
        // all document class for Correspondences
        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        // the search criteria for correspondence
        self.correspondence = new Correspondence({
            year: new Date().getFullYear(),
            registryOU: employeeService.getCurrentOUApplicationUser().ouRegistryID
        });

        self.disableSelectedOrganization = !employeeService.hasPermissionTo('SEARCH_IN_ALL_OU');

        self.isViewCorrespondence = !!viewCallback;

        self.excludeVsId = excludeVsId;
        self.isAdminSearch = isAdminSearch;

        self.multiSelect = multiSelect;

        // all security levels
        //self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();

        // all registry organizations.
        self.organizations = organizations;
        // all years from 2000 till current year.
        self.years = _.range(2000, (new Date().getFullYear() + 1));

        self.classesMap = {
            1: 'outgoing',
            3: 'internal',
            2: 'incoming'
        };
        self.searchType = null;

        self.globalSetting = rootEntity.getGlobalSettings();

        self.selectedCorrespondences = [];

        self.correspondences = [];

        self.selectedIndex = 0;

        self.mainClassificationSearchText = '';
        self.subClassificationSearchText = '';
        self.documentFileSearchText = '';
        self.linkedDocOuSearchText = '';

        self.selectedSiteType = null;
        self.selectedMainSite = null;
        self.selectedSubSite = null;
        self.originality = 1;

        self.correspondenceSiteTypes = correspondenceSiteTypes;
        self.mainSites = [];
        self.mainSitesCopy = angular.copy(self.mainSites);
        self.subSites = [];
        self.subSitesCopy = angular.copy(self.subSites);
        self.siteTypeSearchText = '';
        self.mainSiteSearchText = '';
        self.subSiteSearchText = '';

        self.originalities = [
            new Lookup({
                id: 1,
                defaultArName: langService.getByLangKey('sites_original', 'ar'),
                defaultEnName: langService.getByLangKey('sites_original', 'en'),
                lookupKey: 1
            }),
            new Lookup({
                id: 2,
                defaultArName: langService.getByLangKey('sites_copy', 'ar'),
                defaultEnName: langService.getByLangKey('sites_copy', 'en'),
                lookupKey: 2
            })
        ];

        /**
         * @description get available documentFiles for the document by security level.
         * @param timeout
         * @returns {*}
         * @private
         */
        function _getDocumentFiles(timeout) {
            // var docClass = self.searchType.lookupStrKey;
            var docClass = (!self.searchType || !generator.validRequired(self.searchType.lookupStrKey)) ? 'outgoing' : self.searchType.lookupStrKey;
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
            // var docClass = self.searchType.lookupStrKey;
            var docClass = (!self.searchType || !generator.validRequired(self.searchType.lookupStrKey)) ? 'outgoing' : self.searchType.lookupStrKey;
            if (timeout) {
                return $timeout(function () {
                    self.classifications = angular.copy(correspondenceService.getLookup(docClass, 'classifications'));
                    self.classifications = _displayCorrectClassifications(self.classifications);
                    self.classificationsCopy = angular.copy(self.classifications);
                    self.onChangeMainClassification(null, true);
                });
            } else {
                self.classifications = angular.copy(correspondenceService.getLookup(docClass, 'classifications'));
                self.classifications = _displayCorrectClassifications(self.classifications);
                self.classificationsCopy = angular.copy(self.classifications);
                self.onChangeMainClassification(null, true);
            }
        }

        /**
         * @description to display the correct document files
         * @param documentFiles
         * @returns {Array}
         * @private
         */
        function _displayCorrectDocumentFiles(documentFiles) {
            return _.filter(documentFiles, function (ouDocumentFile) {
                return _securityLevelExist(self.correspondence.securityLevel, ouDocumentFile.file.securityLevels)
            });
        }

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
         * to display the correct classifications
         * @param classifications
         * @returns {Array}
         * @private
         */
        function _displayCorrectClassifications(classifications) {
            return _.filter(classifications, function (ouClassification) {
                ouClassification.classification.children = _filterSubClassification(ouClassification.classification.children);
                return _securityLevelExist(self.correspondence.securityLevel, ouClassification.classification.securityLevels)
            });
        }

        /**
         * @description filter the sub classifications depend on the security level for document.
         * @param classifications
         * @returns {Array}
         * @private
         */
        function _filterSubClassification(classifications) {
            return _.filter(classifications, function (classification) {
                return _securityLevelExist(self.correspondence.securityLevel, classification.securityLevels);
            });
        }


        /**
         * @description on security level changed, get the classifications, document files
         */
        self.onSecurityLevelChange = function () {
            if (self.correspondence.mainClassification && !_securityLevelExist(self.correspondence.securityLevel, self.correspondence.mainClassification.securityLevels)) {
                self.correspondence.mainClassification = null;
            }

            if (self.correspondence.subClassification && !_securityLevelExist(self.correspondence.securityLevel, self.correspondence.subClassification.securityLevels)) {
                self.correspondence.subClassification = null;
            }

            if (self.correspondence.fileId && !_securityLevelExist(self.correspondence.securityLevel, self.correspondence.fileId.securityLevels)) {
                self.correspondence.fileId = null;
            }
            _getClassifications(true);
            _getDocumentFiles(true);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.correspondences = $filter('orderBy')(self.correspondences, self.grid.order);
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        self.grid = {
            progress: null,
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.correspondences.length + 21);
                    }
                }
            ],
            filter: {search: {}},
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.others.linkedDocSearch),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.others.linkedDocSearch, self.grid.truncateSubject);
            }
        };

        /**
         * @description view correspondence .
         * @param correspondence
         * @param $event
         */
        self.viewCorrespondence = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            viewCallback(correspondence, false, [], $event, true);
        };
        /**
         * @description send selected correspondences to parent controller
         */
        self.sendLinkedDocuments = function () {
            dialog.hide(self.selectedCorrespondences)
        };

        _getClassifications(true);
        _getDocumentFiles(true);


        /**
         * @description Set the sub classification on change of main classification
         * @param $event
         * @param skipResetSub
         */
        self.onChangeMainClassification = function ($event, skipResetSub) {
            if (self.correspondence && self.correspondence.mainClassification) {
                self.loadSubClassificationRecords(true, false);
                if (!skipResetSub) {
                    self.correspondence.subClassification = null;
                }
            } else {
                self.correspondence.subClassification = null;
            }
        };

        self.loadMainClassificationRecords = function () {
            if (self.mainClassificationSearchText) {
                classificationService.loadClassificationsPairBySearchText(self.mainClassificationSearchText, self.correspondence.securityLevel, null, false)
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
            if (self.correspondence && self.correspondence.mainClassification && (skipSearchText || self.subClassificationSearchText)) {
                var mainClassification = _.find(self.classifications, function (classification) {
                        return classification.classification.id === self.correspondence.mainClassification.id;
                    }).classification,
                    mainClassificationCopy = _.find(self.classificationsCopy, function (classification) {
                        return classification.classification.id === self.correspondence.mainClassification.id;
                    }).classification;

                classificationService.loadClassificationsPairBySearchText(self.subClassificationSearchText, self.correspondence.securityLevel, self.correspondence.mainClassification, false)
                    .then(function (result) {
                        if (result.first.length || result.second.length) {
                            var lookups = {classifications: result.first, ouClassifications: result.second},
                                classificationsUnion = correspondenceService.prepareLookupHierarchy(lookups, self.correspondence.mainClassification).classifications,
                                subClassifications = [];

                            _.map(classificationsUnion, function (ouClassification) {
                                subClassifications = subClassifications.concat(ouClassification.classification.children);
                                return ouClassification;
                            });

                            self.correspondence.mainClassification.children = _.uniqBy(self.correspondence.mainClassification.children.concat(subClassifications), 'id');
                            mainClassification.children = angular.copy(self.correspondence.mainClassification.children);
                            self.classificationsCopy = angular.copy(self.classifications);
                            if (selectFirstValue) {
                                self.correspondence.subClassification = self.correspondence.mainClassification.children[0];
                            }
                        } else {
                            self.correspondence.mainClassification.children = angular.copy(mainClassificationCopy.children);
                        }
                    })
                    .catch(function (error) {
                        self.correspondence.mainClassification.children = angular.copy(mainClassificationCopy.children);
                    })
            }
        };

        self.loadDocumentFilesRecords = function () {
            if (self.documentFileSearchText) {
                documentFileService.loadDocumentFilesBySearchText(self.documentFileSearchText, self.correspondence.securityLevel, null, false)
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
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
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
                    } else if (fieldType === 'mainSite') {
                        self.loadMainSitesRecords($event);
                    } else if (fieldType === 'subSite') {
                        self.loadSubSitesRecords($event);
                    }
                }
                // prevent keydown except arrow up and arrow down keys
                else if (code !== 38 && code !== 40) {
                    $event.stopPropagation();
                }
            }
        };

        self.changeDocumentClass = function () {
            self.correspondence.refDocNumber = null;
            self.selectedSiteType = null;
            self.selectedMainSite = null;
            self.selectedSubSite = null;
            self.originality = 1;
        };

        self.isAllDocClass = function () {
            return !self.searchType;
        };

        self.isOutgoingDocClass = function () {
            return generator.getNormalizedValue(self.searchType, 'lookupKey') === 0;
        };

        self.isIncomingDocClass = function () {
            return generator.getNormalizedValue(self.searchType, 'lookupKey') === 1;
        };

        self.isInternalDocClass = function () {
            return generator.getNormalizedValue(self.searchType, 'lookupKey') === 2;
        };

        /**
         * @description get selected type by typeId
         * @param typeId
         * @private
         */
        function _getTypeByLookupKey(typeId) {
            typeId = typeId.hasOwnProperty('id') ? typeId.lookupKey : typeId;
            return _.find(self.correspondenceSiteTypes, function (type) {
                return typeId === type.lookupKey;
            });
        }

        /**
         * map sub Sites.
         * @param siteView
         * @private
         */
        function _mapSubSites(siteView) {
            return (new Site_Search())
                .mapFromSiteView(siteView)
                .setFollowupStatus(noneLookup)
                .setCorrespondenceSiteType(_getTypeByLookupKey(siteView.correspondenceSiteTypeId));
        }

        /**
         * @description Get the main sites on change of site type
         * @param $event
         */
        self.getMainSites = function ($event) {
            self.selectedMainSite = null;
            self.selectedSubSite = null;
            self.mainSites = [];
            self.mainSitesCopy = angular.copy(self.mainSites);
            self.subSites = [];
            self.subSitesCopy = angular.copy(self.subSites);

            if (self.selectedSiteType) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: generator.getNormalizedValue(self.selectedSiteType, 'lookupKey'),
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(result);
                });
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.getSubSites = function ($event) {
            self.selectedSubSite = null;
            self.subSites = [];
            self.subSitesCopy = angular.copy(self.subSites);

            var mainSite = generator.getNormalizedValue(self.selectedMainSite, 'id');
            if (mainSite) {
                correspondenceViewService.correspondenceSiteSearch('sub', {
                    type: generator.getNormalizedValue(self.selectedSiteType, 'lookupKey'),
                    parent: mainSite,
                    criteria: null,
                    excludeOuSites: false,
                    includeDisabled: true // to include private regOu
                }).then(function (result) {
                    self.selectedSubSite = null;
                    self.subSites = _.map(result, _mapSubSites);
                    self.subSitesCopy = angular.copy(self.subSites);
                });
            }
        };

        /**
         * @description request service for loading dropdown records with searchText
         * @param $event
         */
        self.loadMainSitesRecords = function ($event) {
            if (self.selectedSiteType && self.mainSiteSearchText) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: generator.getNormalizedValue(self.selectedSiteType, 'lookupKey'),
                    criteria: self.mainSiteSearchText,
                    excludeOuSites: false
                }).then(function (result) {
                    if (result.length) {
                        var availableMainSitesIds = _.map(self.mainSitesCopy, 'id');
                        result = _.filter(result, function (corrSite) {
                            return availableMainSitesIds.indexOf(corrSite.id) === -1;
                        });
                        self.mainSites = self.mainSites.concat(result);
                        self.mainSitesCopy = angular.copy(self.mainSites);
                    } else {
                        self.mainSites = angular.copy(self.mainSitesCopy);
                    }
                }).catch(function (error) {
                    self.mainSites = angular.copy(self.mainSitesCopy);
                });
            }
        };

        /**
         * @description request service for loading sub site dropdown records with searchText
         * @param $event
         */
        self.loadSubSitesRecords = function ($event) {
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: generator.getNormalizedValue(self.selectedSiteType, 'lookupKey'),
                parent: generator.getNormalizedValue(self.selectedMainSite, 'id'),
                criteria: self.subSiteSearchText,
                excludeOuSites: false,
                includeDisabled: true // to include private regOu
            }).then(function (result) {
                if (result.length) {
                    var availableSubSitesIds = _.map(self.subSitesCopy, 'subSiteId');
                    result = _.filter(result, function (corrSite) {
                        return availableSubSitesIds.indexOf(corrSite.id) === -1;
                    });

                    result = _.map(result, _mapSubSites);
                    self.subSites = self.subSites.concat(result);
                    self.subSitesCopy = angular.copy(self.subSites);

                } else {
                    self.subSites = angular.copy(self.subSitesCopy);
                }
            }).catch(function (error) {
                return self.subSites = angular.copy(self.subSitesCopy);
            });
        };

        /**
         * @description start search after create your criteria.
         */
        self.searchLinkedDocuments = function () {
            var vsIds = self.excludeVsId ? [self.excludeVsId] : [];

            self.correspondence.siteType = self.selectedSiteType ? self.selectedSiteType : null;
            self.correspondence.mainSite = self.selectedMainSite ? self.selectedMainSite : null;
            self.correspondence.subSite = self.selectedSubSite ? self.selectedSubSite : null;
            self.correspondence.originality = self.originality ? self.originality : 1;

            var searchCriteria = angular.copy(self.correspondence);
            if (!self.searchType) {
                searchCriteria.docClassName = 'Correspondence';
                searchCriteria.classDescription = 'Correspondence';
            } else {
                searchCriteria.setDocClassName(self.searchType.getStringKeyValue())
            }

            correspondenceService
                .correspondenceSearch(searchCriteria, isAdminSearch)
                .then(function (result) {
                    self.correspondences = _.filter(result, function (item) {
                        return vsIds.indexOf(item.getInfo().vsId) === -1;
                    });
                    if (self.correspondences.length) {
                        // go to result tab.
                        self.selectedIndex = true;
                    } else {
                        // if no result found display message.
                        dialog.infoMessage(langService.get('no_results_found_for_your_search_criteria'));
                    }
                });
        };

        /**
         * @description close the linkedDocument without sending any correspondence.
         */
        self.closeLinkedDocuments = function () {
            dialog.cancel();
        };
    });
};
