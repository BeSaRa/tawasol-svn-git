module.exports = function (app) {
    app.controller('searchLinkedDocumentPopCtrl', function (lookupService,
                                                            organizationService,
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
                                                            employeeService,
                                                            isAdminSearch,
                                                            gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchLinkedDocumentPopCtrl';
        // all document class for Correspondences
        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        // the search criteria for correspondence
        self.correspondence = new Correspondence({
            year: new Date().getFullYear()/*,
            registryOU: employeeService.getCurrentOUApplicationUser().ouRegistryID*/
        });

        self.excludeVsId = excludeVsId;
        self.isAdminSearch = isAdminSearch;

        self.multiSelect = multiSelect;

        // all security levels
        //self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();

        // all organization organizations -> pop resolve.
        //self.organizations = organizationService.organizations;
        self.organizations = _.filter(organizationService.organizations, function (organization) {
            return organization.hasRegistry;
        });

        self.classesMap = {
            1: 'outgoing',
            3: 'internal',
            2: 'incoming'
        };
        self.searchType = self.documentClasses[0];

        self.globalSetting = rootEntity.getGlobalSettings();

        self.selectedCorrespondences = [];

        self.correspondences = [];

        self.selectedIndex = 0;

        /**
         * @description get available documentFiles for the document by security level.
         * @param timeout
         * @returns {*}
         * @private
         */
        function _getDocumentFiles(timeout) {
            var docClass = self.searchType.lookupStrKey;
            if (timeout) {
                return $timeout(function () {
                    self.documentFiles = angular.copy(correspondenceService.getLookup(docClass, 'documentFiles'));
                    self.documentFiles = _displayCorrectDocumentFiles(self.documentFiles);
                });
            } else {
                self.documentFiles = angular.copy(correspondenceService.getLookup(docClass, 'documentFiles'));
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
            var docClass = self.searchType.lookupStrKey;
            if (timeout) {
                return $timeout(function () {
                    self.classifications = angular.copy(correspondenceService.getLookup(docClass, 'classifications'));
                    self.classifications = _displayCorrectClassifications(self.classifications);
                });
            } else {
                self.classifications = angular.copy(correspondenceService.getLookup(docClass, 'classifications'));
                self.classifications = _displayCorrectClassifications(self.classifications);
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

        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return self.globalSetting.searchAmountLimit
                     }*/
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


        self.years = function () {
            var currentYear = new Date().getFullYear(), years = [];
            var lastYearForRange = currentYear - 10;
            while (lastYearForRange <= currentYear) {
                years.push(currentYear--);
            }
            return years;
        };
        /**
         * @description start search after create your criteria.
         */
        self.searchLinkedDocuments = function () {
            var vsIds = self.excludeVsId ? [self.excludeVsId] : [];
            correspondenceService
                .correspondenceSearch(self.correspondence.setDocClassName(self.searchType.getStringKeyValue()), isAdminSearch)
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
        /**
         * @description close the linkedDocument without sending any correspondence.
         */
        self.closeLinkedDocuments = function () {
            dialog.cancel();
        };

        _getClassifications(true);
        _getDocumentFiles(true);
    });
};
