module.exports = function (app) {
    app.controller('searchIncomingScreenDirectiveCtrl', function (searchIncomingService,
                                                                  IncomingSearch,
                                                                  $scope,
                                                                  employeeService,
                                                                  LangWatcher,
                                                                  _,
                                                                  $filter,
                                                                  validationService,
                                                                  dialog,
                                                                  generator,
                                                                  cmsTemplate,
                                                                  gridService,
                                                                  classificationService,
                                                                  documentFileService,
                                                                  langService,
                                                                  lookupService,
                                                                  correspondenceViewService,
                                                                  correspondenceService,
                                                                  Site_Search,
                                                                  Lookup,
                                                                  organizationService,
                                                                  viewDocumentService,
                                                                  ResolveDefer,
                                                                  $q,
                                                                  $state,
                                                                  managerService,
                                                                  contextHelpService,
                                                                  toast,
                                                                  viewTrackingSheetService,
                                                                  downloadService,
                                                                  counterService,
                                                                  rootEntity,
                                                                  favoriteDocumentsService,
                                                                  mailNotificationService,
                                                                  userSubscriptionService,
                                                                  printService,
                                                                  ouApplicationUserService,
                                                                  configurationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchIncomingScreenDirectiveCtrl';
        // watcher to make langService available for view
        LangWatcher($scope);
        // current employee
        self.employee = employeeService.getEmployee();
        // today date
        self.maxCreateDate = new Date();

        /********** special properties **********/


        // the main service for controller
        self.controllerService = searchIncomingService;
        // screen search criteria
        self.searchCriteria = _createNewSearchCriteria();
        self.selectedSearchedIncomingDocuments = [];
        self.searchedIncomingDocuments = [];
        // to use it later in reload search
        self.searchCriteriaModel = angular.copy(self.searchCriteria);
        /********** end special properties **********/
        self.selectedTab = 0;
        // search text for filtering registry organizations DDL
        self.registryOUSearchText = '';
        // search text for filtering organizations DDL
        self.ouSearchText = '';
        // it will override from searchScreenCtrl
        self.registryOrganizations = [];
        // no matter if we used Outgoing as document class to get siteTypes because it is common for all document classes
        self.siteTypes = correspondenceService.getLookup('outgoing', 'siteTypes');

        self.docTypes = correspondenceService.getLookup('incoming', 'docTypes');

        // search text for filtering docTypes DDL
        self.docTypeSearchText = '';
        // organization to fill ou property in search criteria
        self.organizations = [];
        // search text for filtering mainSite DDL
        self.mainSiteSearchText = '';
        // main sites
        self.mainSites = [];
        // search text for filtering subSite DDL
        self.subSiteSearchText = '';
        // sub sites
        self.subSites = [];
        // old main sites in case user asked the server for more mainSites
        self.previousMainSites = [];
        // old main sites in case user asked the server for more subSites
        self.previousSubSites = [];
        // static lookups to represent originality
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
        // security levels for current employee.
        self.securityLevels = angular.copy(rootEntity.getGlobalSettings().securityLevels);
        // search text for filtering fromRegOu DDL
        self.fromRegOUIdSearchText = '';
        // priority levels lookup
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        // no matter if we used same document class [outgoing] for all document class because there is no relation between entity type and document class
        self.entityTypes = correspondenceService.getLookup('outgoing', 'entityTypes');
        // document formats electronic / paper
        self.documentformats = [
            {
                value: 0,
                key: "electronic"
            },
            {
                value: 1,
                key: "paper"
            }
        ];
        // followup lookup
        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);
        // used to disable/enable followupDates depend on need reply status if it is selected.
        self.displayFollowUpDates = false;
        // all years from 2000 till current year.
        self.years = _.range(2000, (new Date().getFullYear() + 1));
        // search text for filtering years DDL
        self.yearSearchText = '';
        // search text for filtering years DDL
        self.approversSearchText = '';
        // search text for filtering years DDL
        self.creatorsSearchText = '';
        //TODO: will remove it later
        self.validateLabelsSearch = {};
        // search text for filtering mainClassification DDL
        self.mainClassificationSearchText = '';
        // mainClassifications list
        self.mainClassifications = [];
        // search text for filtering subClassification DDL
        self.subClassificationSearchText = '';
        // subClassifications list
        self.subClassifications = [];
        // old main classifications
        self.previousMainClassifications = [];
        // old sub classifications
        self.previousSubClassifications = [];
        // search text for filtering documentFiles DDL
        self.documentFileSearchText = '';
        // documentFiles list
        self.documentFiles = [];
        // old document Files
        self.previousDocumentFiles = [];
        // mapped property configurations
        self.configurations = {};
        // registry ous came from bindings.
        self.availableRegistryOrganizations = [];

        var noneLookup = new Lookup({
            defaultEnName: langService.getByLangKey('none', 'en'),
            defaultArName: langService.getByLangKey('none', 'ar')
        });


        function _createNewSearchCriteria() {
            return new IncomingSearch({
                registryOU: self.employee.getRegistryOUID(),
                originality: 1,
                year: new Date().getFullYear(),
                docDateFrom: generator.convertDateToString(new Date(self.maxCreateDate.getFullYear(), 0, 1, 0, 0, 0, 0)),
                docDateTo: generator.convertDateToString(self.maxCreateDate)
            });
        }

        // prepare classifications
        _getClassifications();
        // prepare documentFiles
        _getDocumentFiles();

        /**
         * @description get available classifications for the document by security level.
         * @returns {*}
         * @private
         */
        function _getClassifications() {
            var docClass = self.searchCriteria.docClassName.toLowerCase() === 'correspondence' ? 'outgoing' : self.searchCriteria.docClassName;
            self.mainClassifications = angular.copy(correspondenceService.getLookup(docClass, 'classifications'));
            self.mainClassifications = _displayCorrectClassifications(self.mainClassifications);
        }

        /**
         * @description get available documentFiles for the document by security level.
         * @param timeout
         * @returns {*}
         * @private
         */
        function _getDocumentFiles(timeout) {
            var docClass = self.searchCriteria.docClassName.toLowerCase() === 'correspondence' ? 'outgoing' : self.searchCriteria.docClassName;
            self.documentFiles = angular.copy(correspondenceService.getLookup(docClass, 'documentFiles'));
            self.documentFiles = _displayCorrectDocumentFiles(self.documentFiles);
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
                return _securityLevelExist(self.searchCriteria.securityLevel, ouClassification.classification.securityLevels)
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
                return _securityLevelExist(self.searchCriteria.securityLevel, ouDocumentFile.file.securityLevels)
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
                return _securityLevelExist(self.searchCriteria.securityLevel, classification.securityLevels);
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
         * to avoid correspondence sites check because we are in the search means all correspondence ahas sites
         * @param result
         * @returns {Array}
         * @private
         */
        function _mapResultToAvoidCorrespondenceCheck(result) {
            return _.map(result, function (item) {
                item.mainSiteId = true;
                return item;
            });
        }

        /**
         * @description get selected type by typeId
         * @param typeId
         * @private
         */
        function _getTypeByLookupKey(typeId) {
            typeId = typeId.hasOwnProperty('id') ? typeId.lookupKey : typeId;
            return _.find(self.siteTypes, function (type) {
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
         * @description Updates the creators list
         * @private
         */
        function _updateCreatorsList() {
            ouApplicationUserService
                .searchByCriteria({
                    regOu: self.searchCriteria.registryOU
                })
                .then(function (result) {
                    self.creatorsList = result;
                });
        }

        self.cleanSearchCriteriaForms = function () {
            self.searchCriteria = _createNewSearchCriteria();
            self.searchCriteriaModel = angular.copy(self.searchCriteria);
        };

        /**
         * @description get less date or today ... used for FromDates if ToDate null or undefined use today.
         * @param date
         * @returns {*|Date}
         */
        self.getLessDateOrToday = function (date) {
            return date !== null && date !== undefined ? (date.valueOf() < self.maxCreateDate ? date : self.maxCreateDate) : self.maxCreateDate;
        };
        /**
         * @description fir the callback if the provider  text length equal = 0
         * @param $event
         * @param text
         * @param callback
         */
        self.setPropertiesSpaceBackIfNoLength = function ($event, text, callback) {
            var key = $event.keyCode || $event.which;
            if (!text.length && key === 8) {
                callback();
            }
        };
        /**
         * capture any event except arrows UP/DOWN allow those.
         * @param $event
         * @param enterCallback
         */
        self.allowPropagationUpDownArrows = function ($event, enterCallback) {
            var key = $event.keyCode || $event.which;
            if (key === 13 && enterCallback) {
                enterCallback($event);
                $event.stopPropagation();
            }
            var allowedKeys = [38 /* UP */, 40 /* DOWN */];
            allowedKeys.indexOf(key) === -1 ? $event.stopPropagation() : null;
        };
        /**
         * @description set previous main sites to the active list
         */
        self.setOldMainSites = function () {
            self.previousMainSites.length && !self.mainSites.length ? self.mainSites = self.previousMainSites : null;
            self.previousMainSites = [];
        };
        /**
         * @description set previous sub sites to the active list
         */
        self.setOldSubSites = function () {
            self.previousSubSites.length && !self.subSites.length ? self.subSites = self.previousSubSites : null;
            self.previousSubSites = [];
        };
        /**
         * @description set previousMainClassifications in case if it has length
         */
        self.setOldMainClassification = function () {
            self.previousMainClassifications.length && !self.mainClassifications.length ? self.mainClassifications = self.previousMainClassifications : null;
            self.previousMainClassifications = [];
        };
        /**
         * @description set previousSubClassifications in case if it has length
         */
        self.setOldSubClassification = function () {
            self.previousSubClassifications.length && !self.subClassifications.length ? self.subClassifications = self.previousSubClassifications : null;
            self.previousSubClassifications = [];
        };
        /**
         * @description set previousDocumentFiles in case if it has length
         */
        self.setOldDocumentFiles = function () {
            self.previousDocumentFiles.length && !self.documentFiles.length ? self.documentFiles = self.previousDocumentFiles : null;
            self.previousDocumentFiles = [];
        };
        /**
         * @description fire after change registryOU to reload sub organizations for selected reg ou.
         */
        self.onRegistrySelectedChange = function () {
            self.searchCriteria.creatorId = null;
            if (!self.searchCriteria.registryOU) {
                self.creatorsList = [];
                return;
            }
            // load children organizations by selected regOUId
            organizationService
                .loadChildrenOrganizations(self.searchCriteria.registryOU)
                .then(function (organizations) {
                    var organizationsIdList = _.map(organizations, 'id');
                    // the use logged in with reg ou
                    if (self.employee.isInDepartment()) {
                        organizationsIdList.indexOf(self.employee.getOUID()) === -1 && organizations.unshift(angular.copy(self.employee.userOrganization));
                    } else {
                        organizationsIdList.indexOf(self.employee.getRegistryOUID()) === -1 && organizations.unshift(organizationService.getOrganizationById(self.employee.getRegistryOUID(), true));
                    }
                    self.organizations = organizations;
                });

            _updateCreatorsList();
        };
        /**
         * @description fir after site type changed to reload main sites related to selected site type.
         */
        self.onSiteTypeChanged = function () {
            self.searchCriteria.mainSite = null;
            self.searchCriteria.subSite = null;
            self.previousMainSites = [];
            if (!self.searchCriteria.siteType) {
                return;
            }
            self.loadSitesByCriteria('main')
                .then(function (sites) {
                    self.mainSites = sites;
                });
        };
        /**
         * @description to load a new sub sites depend on selected main site
         */
        self.onMainSiteChanged = function () {
            if (!self.searchCriteria.mainSite) {
                self.searchCriteria.subSite = null;
                self.previousSubSites = [];
                return;
            }
            self.loadSitesByCriteria('sub')
                .then(function (sites) {
                    self.subSites = _.map(sites, _mapSubSites);
                });
        };
        /**
         * @description load sites by criteria
         * @param type
         * @param criteria
         * @returns {*}
         */
        self.loadSitesByCriteria = function (type, criteria) {
            return correspondenceViewService
                .correspondenceSiteSearch(type, {
                    type: self.searchCriteria.siteType.lookupKey,
                    criteria: criteria ? criteria : null,
                    parent: type === 'main' ? null : self.searchCriteria.mainSite.id,
                    excludeOuSites: false,
                    includeDisabled: true
                });
        };
        /***
         * @description load main sites by criteria
         * @param $event
         */
        self.loadMainSitesByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }
            // to reserve old main sites
            if (self.mainSites.length)
                self.previousMainSites = angular.copy(self.mainSites);

            self.loadSitesByCriteria('main', self.mainSiteSearchText)
                .then(function (sites) {
                    self.mainSites = sites;
                })
        };
        /**
         * @description load sub sites depend on criteria ... used to load more if the current su sites dose not have what the user searched for.
         * @param $event
         */
        self.loadSubSitesByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }
            // to reserve old sub sites
            if (self.subSites.length)
                self.previousSubSites = angular.copy(self.subSites);

            self.loadSitesByCriteria('sub', self.subSiteSearchText)
                .then(function (sites) {
                    self.subSites = _.map(sites, _mapSubSites);
                });
        };
        /**
         * @description load sites by criteria
         * @param type
         * @param criteria
         * @returns {*}
         */
        self.loadClassificationsByCriteria = function (type, criteria) {
            return classificationService
                .loadClassificationsPairBySearchText(criteria, self.searchCriteria.securityLevel, (type === 'main' ? null : self.searchCriteria.mainClassification), true)
                .then(function (pair) {
                    type !== 'main' ? pair.first.push(self.searchCriteria.mainClassification) : null;
                    var lookups = {classifications: pair.first, ouClassifications: pair.second},
                        classifications = correspondenceService.prepareLookupHierarchy(lookups).classifications;
                    return type === 'main' ? classifications : _.flatten(_.map(classifications, 'classification.children'));
                });
        };
        /**
         * @description load Main depend on criteria ... used to load more if the current mainClassifications dose not have what the user searched for.
         * @param $event
         */
        self.loadMainClassificationByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }

            // to reserve old sub sites
            if (self.mainClassifications.length)
                self.previousMainClassifications = angular.copy(self.mainClassifications);

            self.loadClassificationsByCriteria('main', self.mainClassificationSearchText)
                .then(function (classifications) {
                    self.mainClassifications = classifications;
                });
        };
        /**
         * @description load Sub depend on criteria ... used to load more if the current subClassifications dose not have what the user searched for.
         * @param $event
         */
        self.loadSubClassificationByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }
            // to reserve old sub sites
            if (self.subClassifications.length)
                self.previousSublassifications = angular.copy(self.subClassifications);

            self.loadClassificationsByCriteria('sub', self.subClassificationSearchText)
                .then(function (classifications) {
                    self.subClassifications = classifications;
                });
        };
        /**
         * @description load documentFiles ... used to load more if the current documentFiles dose not have what the user searched for.
         * @param $event
         */
        self.loadDocumentFilesByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }

            // to reserve old sub sites
            if (self.documentFiles.length)
                self.previousDocumentFiles = angular.copy(self.documentFiles);

            documentFileService.loadDocumentFilesBySearchText(self.documentFileSearchText, self.searchCriteria.securityLevel, null, true)
                .then(function (pair) {
                    var lookups = {classifications: pair.first, ouClassifications: pair.second};
                    self.documentFiles = correspondenceService.prepareLookupHierarchy(lookups).documentFiles;
                });
        };
        /**
         * @description to load a new sub classifications depend on selected main classification
         */
        self.onMainClassificationChanged = function () {
            if (!self.searchCriteria.mainClassification) {
                self.searchCriteria.subClassification = null;
                self.previousSubClassifications = [];
                return;
            }
            self.loadClassificationsByCriteria('sub', '')
                .then(function (classifications) {
                    self.subClassifications = classifications;
                });
        };
        /**
         * @description When file is changed, get the file code and file serial
         * @param file
         */
        self.onFileChanged = function (file) {
            var ouDocumentFile = _.find(self.documentFiles, function (ouDocumentFile) {
                return file && ouDocumentFile.file.id === file.id;
            });
            if (ouDocumentFile) {
                self.searchCriteria.fileCode = ouDocumentFile.code || self.searchCriteria.fileCode;
                self.searchCriteria.fileSerial = ouDocumentFile.serial || self.searchCriteria.fileSerial;
            }
        };
        /**
         * @description When the file code changed, get the file
         */
        self.onFileCodeChanged = function () {
            var file = _.find(self.documentFiles, function (ouDocumentFile) {
                return (ouDocumentFile.code + '').trim() === (self.searchCriteria.fileCode + '').trim();
            });
            if (file)
                self.searchCriteria.fileId = file.file;
        };

        /**
         * to display year dialog if user select all year.
         * @param $event
         */
        self.onYearChanged = function ($event) {
            if (self.searchCriteria.year === 'All') {
                self.changeYearRange($event);
            } else {
                var from = new Date(self.searchCriteria.year, 0, 1, 0, 0, 0, 0);
                var to = (self.maxCreateDate.getFullYear() === self.searchCriteria.year) ? self.maxCreateDate : new Date(self.searchCriteria.year, 11, 31, 23, 59, 59, 999);
                self.searchCriteria.docDateFrom = generator.convertDateToString(from);
                self.searchCriteria.docDateTo = generator.convertDateToString(to);
            }
        };
        /**
         * @description dialog to change year dates
         * @returns {*}
         */
        self.changeYearRange = function () {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('search-doc-date-range'),
                    controller: 'searchDocDateRangePopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    escapeToClose: false,
                    locals: {
                        document: angular.copy(self.searchCriteria),
                        year: self.searchCriteria.year
                    }
                }).then(function (result) {
                    self.searchCriteria.docDateFrom = result.dateFromLabel;
                    self.searchCriteria.docDateTo = result.dateToLabel;
                })
                .catch(function (result) {
                    if (!(self.searchCriteria.docDateFrom && self.searchCriteria.docDateTo)) {
                        self.searchCriteria.year = null;
                        if (!self.required.hasOwnProperty('docDateFrom'))
                            self.required.docDateFrom = {};
                        self.required.docDateFrom.isMandatory = false;
                        if (!self.required.hasOwnProperty('docDateTo'))
                            self.required.docDateTo = {};
                        self.required.docDateTo.isMandatory = false;
                    }
                    self.searchCriteria.docDateFrom = result.dateFromLabel;
                    self.searchCriteria.docDateTo = result.dateToLabel;
                });
        };
        /**
         * @description to check the followupStatus value if need replay included enable followup dates.
         */
        self.checkFollowUpStatusValue = function () {
            self.displayFollowUpDates = !!_.find(self.searchCriteria.followupStatus, function (item) {
                return item.lookupStrKey === 'NEED_REPLY';
            });
            // empty the follow up dates in case there is no 'NEED_REPLY' Selected from followup status .
            if (!self.displayFollowUpDates) {
                self.searchCriteria.followUpTo = null;
                self.searchCriteria.followUpFrom = null;
            }
        };
        /**
         * @description Opens the popup to fill selected entity type values
         * @param resetValues
         */
        self.openEntityTypePopup = function (resetValues) {
            if (resetValues)
                self.searchCriteria.linkedEntities = null;
            if (self.searchCriteria.selectedEntityType) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('manage-document-entities-search'),
                        controller: 'manageDocumentEntitiesSearchPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            documentClass: self.searchCriteria.docClassName,
                            linkedEntity: self.searchCriteria.linkedEntities,
                            selectedEntityType: self.searchCriteria.selectedEntityType,
                            formValid: !!self.searchCriteria.linkedEntities
                        }
                    }).then(function (result) {
                        self.searchCriteria.linkedEntities = result.linkedEntity;
                        self.searchCriteria.selectedEntityType = result.selectedEntityType;
                    })
                    .catch(function (result) {
                        self.searchCriteria.selectedEntityType = result.linkedEntity ? result.selectedEntityType : null;
                        self.searchCriteria.linkedEntities = result.linkedEntity;
                    });
            } else {
                self.searchCriteria.linkedEntities = null;
                self.searchCriteria.selectedEntityType = null;
            }
        };
        // run search query
        self.searchCorrespondence = function () {
            validationService
                .createValidation('SEARCH_OUTGOING')
                .addStep('check_required', true, [], self.searchCriteria, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearch[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    self.controllerService
                        .searchForDocuments(self.searchCriteria, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchCriteriaModel = angular.copy(self.searchCriteria);
                            self.searchedIncomingDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                            self.selectedSearchedIncomingDocuments = [];
                            self.selectedTab = 1;
                        })
                        .catch(function (error) {

                        });
                })
                .catch(function () {

                });
        };
        /**
         * @description reload search screen
         * @param pageNumber
         * @returns {Promise<unknown>}
         */
        self.reloadSearchCorrespondence = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return self.controllerService
                .searchForDocuments(self.searchCriteriaModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedIncomingDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                    self.selectedSearchedIncomingDocuments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Prints the result
         * @param $event
         */
        self.printResult = function ($event) {
            var printTitle = langService.get("search_module_search_results") + " " +
                langService.get("from") + " " + generator.convertDateToString(self.searchCriteria.docDateFrom) + " " +
                langService.get("to") + " " + generator.convertDateToString(self.searchCriteria.docDateTo);

            var headers = [
                'label_serial',
                'subject',
                'document_number',
                'label_document_type',
                'creator',
                'created_on',
                'correspondence_sites'
            ];

            printService
                .printData(self.searchedIncomingDocuments, headers, printTitle);

        };
        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.incoming) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.incoming, self.searchedIncomingDocuments),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.incoming, limit);
            },
            filter: {search: {}},
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.search.incoming),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.search.incoming, self.grid.truncateSubject);
            }
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

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.searchedIncomingDocuments = $filter('orderBy')(self.searchedIncomingDocuments, self.grid.order);
        };
        /**
         * @description add selected items to the favorite documents
         * @param $event
         */
        self.addToFavoriteBulk = function ($event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAddBulk(self.selectedSearchedIncomingDocuments, $event)
                .then(function (result) {
                    self.reloadSearchCorrespondence(self.grid.page);
                });
        };


        /**
         * @description add an item to the favorite documents
         * @param searchedIncomingDocument
         * @param $event
         */
        self.addToFavorite = function (searchedIncomingDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedIncomingDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedIncomingDocument.getTranslatedName()
                        }));
                    } else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /**
         * @description Archive the document to icn
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.addToIcnArchive = function (correspondence, $event, defer) {
            correspondence.addToIcnArchiveDialog($event)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /*
         /!**
         * @description Export searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         * @type {[*]}
         *!/
         self.exportSearchIncomingDocument = function (searchedIncomingDocument, $event) {
         //console.log('export searched incoming document : ', searchedIncomingDocument);
         searchIncomingService
         .exportSearchIncoming(searchedIncomingDocument, $event)
         .then(function (result) {
         self.reloadSearchCorrespondence(self.grid.page)
         .then(function () {
         toast.success(langService.get('export_success'));
         });
         });
         };*/


        /**
         * @description Launch distribution workflow for incoming item
         * @param searchedIncomingDocument
         * @param $event
         */
        self.launchDistributionWorkflow = function (searchedIncomingDocument, $event) {
            if (!searchedIncomingDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            searchedIncomingDocument.launchWorkFlow($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Launch distribution workflow with sequential workflow
         * @param record
         * @param $event
         * @param defer
         */
        self.launchSequentialWorkflow = function (record, $event, defer) {
            if (!record.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            record.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Subscribe to actions on the workItem
         * @param correspondence
         * @param $event
         */
        self.subscribe = function (correspondence, $event) {
            userSubscriptionService.controllerMethod.openAddSubscriptionDialog(correspondence, $event);
        };

        /**
         * @description Print Barcode
         * @param searchedIncomingDocument
         * @param $event
         */
        self.printBarcode = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.barcodePrint($event);
        };

        self.addDocumentTask = function (correspondence, $event) {
            correspondence.createDocumentTask($event)
        };

        /**
         * @description View Tracking Sheet
         * @param searchedIncomingDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedIncomingDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedIncomingDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageTags = function (searchedIncomingDocument, $event) {
            managerService.manageDocumentTags(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event)
                .then(function (tags) {
                    searchedIncomingDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedIncomingDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageComments = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.manageDocumentComments($event)
                .then(function (documentComments) {
                    searchedIncomingDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedIncomingDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageTasks = function (searchedIncomingDocument, $event) {
          //  console.log('manage tasks for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description manage attachments for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageAttachments = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.manageDocumentAttachments($event).then(function () {
                self.reloadSearchCorrespondence(self.grid.page)
            }).catch(function () {
                self.reloadSearchCorrespondence(self.grid.page);
            });
        };

        /**
         * @description manage linked documents for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedIncomingDocument, $event) {
            var info = searchedIncomingDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedIncomingDocument, $event) {
            managerService
                .manageDocumentEntities(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event);
        };

        /**
         * @description Destinations
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageDestinations = function (searchedIncomingDocument, $event) {
            managerService.manageDocumentCorrespondence(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event)
        };

        /**
         * @description download main document for searched incoming document
         * @param correspondence
         * @param $event
         */
        self.downloadMainDocument = function (correspondence, $event) {
            correspondence
                .mainDocumentDownload($event);
        };

        /**
         * @description download composite document for searched incoming document
         * @param correspondence
         * @param $event
         */
        self.downloadCompositeDocument = function (correspondence, $event) {
            correspondence
                .compositeDocumentDownload($event);
        };

        /**
         * @description download selected document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.downloadSelected = function (searchedIncomingDocument, $event) {
            downloadService.openSelectedDownloadDialog(searchedIncomingDocument, $event);
        };

        /**
         * @description merge and download
         * @param searchedIncomingDocument
         */
        self.mergeAndDownloadFullDocument = function (searchedIncomingDocument) {
            downloadService.mergeAndDownload(searchedIncomingDocument);
        };

        /**
         * @description send link to document for searched incoming document
         * @param correspondence
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (correspondence, $event) {
            correspondence
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description send composite document as attachment for searched incoming document
         * @param correspondence
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (correspondence, $event) {
            correspondence
                .getCompositeDocumentEmailContent($event);
        };


        /**
         * @description send main document fax for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.openSendFaxDialog($event);
        };

        /**
         * @description send sms for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         * @param defer
         */
        self.sendSMS = function (searchedIncomingDocument, $event, defer) {
            searchedIncomingDocument.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendDocumentLink = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.openSendDocumentURLDialog($event);
        };

        /**
         * @description get link for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.getLink = function (searchedIncomingDocument, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedIncomingDocument.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description create copy for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.createCopy = function (searchedIncomingDocument, $event) {
          //  console.log('create copy for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description End followup of correspondence site
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.endFollowup = function (correspondence, $event, defer) {
            correspondence.endFollowup($event)
                .then(function (result) {
                    if (result !== 'FAILED_TERMINATE_FOLLOWUP') {
                        self.reloadSearchCorrespondence(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    }
                });
        };

        /**
         * @description Change the followup status of correspondence sites
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.changeFollowupStatus = function (correspondence, $event, defer) {
            correspondence.changeFollowupStatus($event)
                .then(function (result) {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Create Reply
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.createReply = function (correspondence, $event, defer) {
            correspondence.createReply($event, false)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Create Reply Specific version
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.createReplySpecificVersion = function (correspondence, $event, defer) {
            correspondence.createReply($event, true)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            if (checkForViewPopup)
                return !(hasPermission);
            return hasPermission;
        };

        /**
         * @description Preview document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.previewDocument = function (searchedIncomingDocument, $event) {
            if (!searchedIncomingDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedIncomingDocument, self.gridActions, checkIfEditPropertiesAllowed(searchedIncomingDocument, true), checkIfEditCorrespondenceSiteAllowed(searchedIncomingDocument, true))
                .then(function () {
                    return self.reloadSearchCorrespondence(self.grid.page);
                })
                .catch(function () {
                    return self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param correspondence
         * @param $event
         */
        self.viewDocument = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondence.viewFromQueue(self.gridActions, 'searchIncoming', $event)
                .then(function () {
                     return self.reloadSearchCorrespondence(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description get document versions
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (correspondence, $event) {
            return correspondence
                .viewSpecificVersion(self.gridActions, $event);
        };

        /**
         * @description duplicate specific version
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.duplicateVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go('app.incoming.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        /**
         * @description do broadcast for correspondence.
         */
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
        };

        /**
         * @description Remove single correspondence
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.removeCorrespondence = function (correspondence, $event, defer) {
            correspondenceService
                .deleteCorrespondence(correspondence, $event)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description annotate document
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.annotateDocument = function (correspondence, $event, defer) {
            correspondence.openForAnnotation()
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
                .catch(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                });
        };


        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");

            if (checkForViewPopup)
                return !hasPermission || model.isBroadcasted();
            return hasPermission && !model.isBroadcasted();
        };

        /**
         * @description Edit Content
         * @param correspondence
         * @param $event
         */
        self.editContent = function (correspondence, $event) {
            correspondence.manageDocumentContent($event)
                .then(function () {
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                });
        };

        /**
         * @description Edit Properties
         * @param correspondence
         * @param $event
         */
        self.editProperties = function (correspondence, $event) {
            var info = correspondence.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (e) {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        })

                });
        };

        /**
         * @description add Correspondence To My FollowUp
         * @param item
         */
        self.addToDirectFollowUp = function (item) {
            item.addToMyDirectFollowUp();
        };

        /**
         * @description add workItem To other user's FollowUp
         * @param item
         */
        self.addToEmployeeFollowUp = function (item) {
            item.addToUserFollowUp();
        };

        self.gridActions = [
            // Document Information
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'search-incoming'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                }
            },
            // view
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_view',
                shortcut: false,
                callback: self.previewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: [
                    'VIEW_DOCUMENT',
                    'VIEW_DOCUMENT_VERSION'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Preview
                    {
                        type: 'action',
                        icon: 'book-open-variant',
                        text: 'grid_action_preview_document',
                        shortcut: false,
                        showInView: false,
                        callback: self.previewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: false,
                        showInView: false,
                        callback: self.viewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // show versions
                    {
                        type: 'action',
                        icon: 'animation',
                        text: 'grid_action_view_specific_version',
                        shortcut: false,
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Separator
            {
                type: 'separator',
                checkShow: function (action, model) {
                    return true;
                },
                showInView: false
            },
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                permissionKey: [
                    'MANAGE_FAVORITE',
                    'ICN_ENTRY_TEMPLATE',
                    'USER_FOLLOWUP_BOOKS',
                    'ADMIN_USER_FOLLOWUP_BOOKS'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Add To Favorite
                    {
                        type: 'action',
                        icon: 'star',
                        text: 'grid_action_to_favorite',
                        permissionKey: "MANAGE_FAVORITE",
                        shortcut: false,
                        callback: self.addToFavorite,
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return info.docStatus >= 22;
                        }
                    },
                    // Add To ICN Archive
                    {
                        type: 'action',
                        icon: 'archive',
                        text: 'grid_action_icn_archive',
                        callback: self.addToIcnArchive,
                        class: "action-green",
                        permissionKey: 'ICN_ENTRY_TEMPLATE',
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to my follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_my_followup',
                        shortcut: true,
                        callback: self.addToDirectFollowUp,
                        permissionKey: 'USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to employee follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_employee_followup',
                        shortcut: true,
                        callback: self.addToEmployeeFollowUp,
                        permissionKey: 'ADMIN_USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Export /*NOT NEEDED AS DISCUSSED WITH HUSSAM*/
            /* {
             type: 'action',
             icon: 'export',
             text: 'grid_action_export',
             shortcut: true,
             callback: self.exportSearchIncomingDocument,
             class: "action-green",
             checkShow: function (action, model) {
                            return true;
                        }
             },*/
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                callback: self.createReply,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.checkCreateReplyPermission();
                }
            },
            // Create Reply For Specific Version
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply_specific_version',
                callback: self.createReplySpecificVersion,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.checkCreateReplyPermission(true);
                }
            },
            // Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Launch Sequential Workflow
            {
                type: 'action',
                icon: gridService.gridIcons.actions.sequentialWF,
                text: 'grid_action_launch_sequential_workflow',
                callback: self.launchSequentialWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_SEQ_WF',
                checkShow: function (action, model) {
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF() && !model.isCorrespondenceApprovedBefore() && !model.isBroadcasted();
                }
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                callback: self.subscribe,
                class: "action-green",
                hide: false,
                checkShow: function (action, model) {
                    return !model.isBroadcasted();
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return (model.getSecurityLevelLookup().lookupKey !== 4) && !model.hasActiveSeqWF();
                }
            },
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: true,
                permissionKey: "DELETE_INCOMING",
                callback: self.removeCorrespondence,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.registryOU === self.employee.getRegistryOUID()
                }
            },
            // Annotate Document
            {
                type: 'action',
                icon: 'draw',
                text: 'grid_action_annotate_document',
                shortcut: true,
                callback: self.annotateDocument,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.userCanAnnotate() && rootEntity.hasPSPDFViewer() && employeeService.hasPermissionTo(configurationService.ANNOTATE_DOCUMENT_PERMISSION);
                }
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'grid_action_print_barcode',
                shortcut: true,
                callback: self.printBarcode,
                class: "action-green",
                permissionKey: 'PRINT_BARCODE',
                checkShow: function (action, model) {
                    return true;
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.search.incoming)
            },
            // add task
            {
                type: 'action',
                icon: 'calendar-check-outline',
                text: 'create_task',
                callback: self.addDocumentTask,
                class: "action-green",
                shortcut: true,
                checkShow: gridService.checkToShowAction
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES",
                    "MANAGE_DESTINATIONS"
                ],
                checkAnyPermission: true,
                showInView: false,
                subMenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_TAGS",
                        callback: self.manageTags,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Comments
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
                        callback: self.manageComments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Tasks
                    {
                        type: 'action',
                        icon: 'note-multiple',
                        text: 'grid_action_tasks',
                        shortcut: false,
                        permissionKey: "MANAGE_TASKS",
                        callback: self.manageTasks,
                        class: "action-red",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Attachments
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: false,
                        permissionKey: "MANAGE_ATTACHMENTS",
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        permissionKey: "MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        //hide:true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_linked_entities',
                        shortcut: false,
                        callback: self.manageLinkedEntities,
                        class: "action-green",
                        permissionKey: "MANAGE_LINKED_ENTITIES",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Destinations
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditCorrespondenceSiteAllowed(model, false);
                        }
                    }
                ]
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                shortcut: false,
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.isCorrespondenceApprovedBefore() && model.getInfo().authorizeByAnnotation) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        shortcut: false,
                        permissionKey: "DOWNLOAD_MAIN_DOCUMENT",
                        callback: self.downloadMainDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        shortcut: false,
                        callback: self.downloadCompositeDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // download selected
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'selective_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.downloadSelected,
                        class: "action-red",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // merge and download
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'merge_and_download',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.mergeAndDownloadFullDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS",
                    "SHARE_BOOK_LINK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'fax',
                        text: 'grid_action_send_document_by_fax',
                        shortcut: false,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return model.canSendByFax();
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // send document link
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'send_document_link',
                        permissionKey: "SHARE_BOOK_LINK",
                        callback: self.sendDocumentLink,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                permissionKey: 'GET_A_LINK_TO_THE_DOCUMENT',
                callback: self.getLink,
                class: "action-green",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Create Copy
            {
                type: 'action',
                icon: 'content-copy',
                text: 'grid_action_create_copy',
                shortcut: true,
                callback: self.createCopy,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // End Follow up
            {
                type: 'action',
                icon: gridService.gridIcons.actions.endFollowup,
                text: 'grid_action_end_follow_up',
                callback: self.endFollowup,
                class: "action-green",
                permissionKey: "MANAGE_DESTINATIONS",
                checkShow: function (action, model) {
                    // only for outgoing/incoming
                    // no follow up status = 0 (need reply)
                    return !model.getSiteFollowupStatus() && !model.getSiteFollowupEndDate()// && model.getSiteMaxFollowupDate();
                }
            },
            // Change Follow up Status
            {
                type: 'action',
                icon: gridService.gridIcons.actions.changeFollowup,
                text: 'grid_action_change_follow_up_status',
                callback: self.changeFollowupStatus,
                class: "action-green",
                permissionKey: "MANAGE_DESTINATIONS",
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Content
                    {
                        type: 'action',
                        icon: 'pencil-box',
                        //text: 'grid_action_content',
                        text: function () {
                            return {
                                contextText: 'grid_action_content',
                                shortcutText: 'grid_action_edit_content'
                            };
                        },
                        callback: self.editContent,
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed || info.docStatus >= 24) {
                                return false;
                            }
                            return employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                        }
                    },
                    // Properties
                    {
                        type: 'action',
                        icon: 'pencil',
                        //text: 'grid_action_properties',
                        text: function () {
                            return {
                                contextText: 'grid_action_properties',
                                shortcutText: 'grid_action_edit_properties'
                            };
                        },
                        callback: self.editProperties,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditPropertiesAllowed(model);
                        }
                    }
                ]
            },
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DUPLICATE_BOOK_FROM_VERSION"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // duplicate specific version
                    {
                        type: 'action',
                        icon: 'content-duplicate',
                        text: 'grid_action_duplication_specific_version',
                        shortcut: false,
                        callback: self.duplicateVersion,
                        class: "action-green",
                        showInView: true,
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);

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
                    if (self.searchCriteria.serialNoTo) {
                        return {
                            value: Number(self.searchCriteria.serialNoTo) - 1,
                            errorValue: Number(self.searchCriteria.serialNoTo)
                        };
                    }
                }
            } else if (field === 'to') {
                if (minOrMax === 'min') {
                    if (self.searchCriteria.serialNoFrom) {
                        return {
                            value: Number(self.searchCriteria.serialNoFrom) + 1,
                            errorValue: self.searchCriteria.serialNoFrom
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

        /**
         * @description to return value of fieldName in property configurations.
         * @param fieldName
         * @param property
         * @returns {*}
         */
        self.checkFieldPropertyValue = function (fieldName, property) {
            fieldName = fieldName.toLowerCase();
            return self.configurations[fieldName] && self.configurations[fieldName][property];
        };
        /**
         * @description to check status value for given field in property configurations.
         * @param fieldName
         * @returns {*}
         */
        self.checkFieldStatus = function (fieldName) {
            return self.checkFieldPropertyValue(fieldName, 'status');
        };

        self.$onInit = function () {
            //self.onRegistrySelectedChange();
            self.organizations = angular.copy(self.ous);
            // assign current controller to search screen ctrl.
            self.controller.controller = self;
            // re map by symbolic name all property configurations
            _.map(self.propertyConfigurations, function (property) {
                self.configurations[property.symbolicName.toLowerCase()] = property;
            });

            self.creatorsList = angular.copy(self.creators);
        };
    });
};
