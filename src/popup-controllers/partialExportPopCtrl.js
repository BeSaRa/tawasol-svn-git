module.exports = function (app) {
    app.controller('partialExportPopCtrl', function (sites,
                                                     $timeout,
                                                     _,
                                                     $filter,
                                                     generator,
                                                     cmsTemplate,
                                                     PartialExportCollection,
                                                     rootEntity,
                                                     langService,
                                                     SiteView,
                                                     Site,
                                                     ignoreMessage,
                                                     dialog,
                                                     $scope,
                                                     CorrespondenceSiteType,
                                                     lookupService,
                                                     configurationService,
                                                     correspondenceViewService,
                                                     correspondenceService,
                                                     correspondence) {
        'ngInject';
        var self = this;
        self.controllerName = 'partialExportPopCtrl';
        // all exported sites
        self.sites = [].concat(sites.first, sites.second);
        // current correspondence
        self.correspondence = correspondence;
        // partial exported list
        self.partialExportList = new PartialExportCollection();

        self.settings = rootEntity.getGlobalSettings();
        // to check if the search is simple or not
        self.isSimpleCorrespondenceSiteSearchType = true;
        // self.isSimpleCorrespondenceSiteSearchType = self.settings.simpleCorsSiteSearch;

        // followup statuses
        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);

        self.disableExport = false;
        self.tabsToShow = [
            // 'exportOptions',
            'correspondenceSites',
            'distributionLists'
        ];
        // i made it here fixed because no other document class has partial export except outgoing
        self.documentClass = 'outgoing';
        // all site types
        self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
        // add none
        self.correspondenceSiteTypes.push(new CorrespondenceSiteType({
            id: null,
            arName: langService.getKey('not_found', 'ar'),
            enName: langService.getKey('not_found', 'en')
        }));
        // all distributions list.
        self.distributionLists = angular.copy(correspondenceService.getLookup(self.documentClass, 'distributionList'));
        // selected site type.
        self.selectedSiteTypeSimple = null;

        self.siteTypeSimpleSearchText = '';
        self.selectedMainSiteSimple = null;
        self.mainSiteSimpleSearchText = '';
        self.simpleSubSiteResultSearchText = '';

        // selected subCorrespondence sites from internal search box
        self.selectedSimpleSub = null;

        self.subRecords = [];
        _concatCorrespondenceSites(false);

        self.exportTypeList = [
            {key: 'export_by_group', value: true},
            {key: 'export_by_selection', value: false}
        ];

        // if selective export from global settings then false, otherwise true
        self.isGroupExport = self.settings.defaultExportTypeGrouping;
        self.exportOptions = self.partialExportList.getKeys();
        self.isInternalOutgoingEnabled = rootEntity.isInternalOutgoingEnabled();
        var info = self.correspondence.getInfo();
        self.isSiteTypesDisabled = self.isInternalOutgoingEnabled && info.documentClass === 'outgoing' && self.correspondence.isInternal;

        self.labels = _.map(self.partialExportList.getKeys(), function (label) {
            return label.toLowerCase();
        });

        self.loadRelatedThings = null;

        function _loadRecordsForSelection() {
            correspondenceService
                .loadRelatedThingsForCorrespondence(self.correspondence)
                .then(function (result) {
                    _.map((result.ATTACHMENTS || result.attachments), function (attachment) {
                        if (attachment.exportStatus) {
                            _addItem(attachment, 'ATTACHMENTS');
                        }
                        return attachment;
                    });
                    self.loadRelatedThings = result;
                });
        }

        self.onChangeExportType = function () {
            self.partialExportList = self.partialExportList.changeExportType();
            if (!self.isGroupExport) {
                _loadRecordsForSelection();
            }
        };

        var canExportOptions = {
            'ATTACHMENTS': 'Attachment',
            'RELATED_BOOKS': 'LinkedDoc',
            'RELATED_OBJECTS': 'LinkedObj'
        };

        self.canExportAnyRelatedData = function () {
            var canExport;
            for (var i in canExportOptions) {
                canExport = self.settings.canExport(canExportOptions[i]);
                if (canExport)
                    break;
            }
            return canExport;// && self.checkAnyLinkedDataAvailable();
        };

        self.canExportRelatedData = function (type) {
            return self.settings.canExport(canExportOptions[type]);
        };


        function _selectedItemExists(item, option) {
            return (_getItemPosition(item, option) !== -1);
        }

        function _getItemPosition(item, option) {
            return self.partialExportList.exportItems[option].indexOf(item);
        }

        function _addItem(item, option) {
            self.partialExportList.exportItems[option].push(item);
        }

        function _removeItem(item, option) {
            self.partialExportList.exportItems[option].splice(_getItemPosition(item, option), 1);
        }

        self.toggleSelectedItem = function (item, option) {
            if (_selectedItemExists(item, option)) {
                _removeItem(item, option);
            } else {
                _addItem(item, option);
            }
        };

        /**
         * create current date + given days if provided.
         * @param days
         * @return {Date}
         * @private
         */
        function _createCurrentDate(days) {
            var date = new Date();
            date.setDate(date.getDate() + (days || 0));
            return date;
        }

        /**
         * concatenate main and sub correspondence sites.
         * @param timeout
         * @return {*}
         * @private
         */
        function _concatCorrespondenceSites(timeout) {
            if (!timeout) {
                self.subRecords = _.map([].concat(self.partialExportList.sitesToList, self.partialExportList.sitesCCList, self.sites), 'subSiteId');
                return;
            }
            return $timeout(function () {
                return self.subRecords = _.map([].concat(self.partialExportList.sitesToList, self.partialExportList.sitesCCList, self.sites), 'subSiteId');
            });
        }

        // reversed map for sites.
        self.reversedMap = {
            CC: 'To',
            To: 'CC'
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataSubSearchResult = function () {
            self.reviewOutgoings = $filter('orderBy')(self.reviewOutgoings, self.grid.subSearchResult.order);
        };
        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataSitesInfoTo = function () {
            self.partialExportList.sitesToList = $filter('orderBy')(self.partialExportList.sitesToList, self.grid.sitesInfoTo.order);
        };
        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataSitesInfoCC = function () {
            self.partialExportList.sitesCCList = $filter('orderBy')(self.partialExportList.sitesCCList, self.grid.sitesInfoCC.order);
        };
        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataSubSearchResult_DL = function () {
            self.subSearchResult_DL = $filter('orderBy')(self.subSearchResult_DL, self.grid.subSearchResult_DL.order);
        };
        self.grid = {
            subSearchResult: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'arName', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.subSearchResult.length + 21);
                        }
                    }
                ]
            },
            sitesInfoTo: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'mainArSiteText', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.partialExportList.sitesToList.length + 21);
                        }
                    }
                ]
            },
            sitesInfoCC: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'mainArSiteText', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.partialExportList.sitesCCList.length + 21);
                        }
                    }
                ]
            },
            subSearchResult_DL: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'arName', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.subSearchResult_DL.length + 21);
                        }
                    }
                ]
            }
        };

        self.subSearchSelected = [];

        self.sitesInfoToSelected = [];
        self.sitesInfoCCSelected = [];


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
            return (new Site())
                .mapFromSiteView(siteView)
                .setFollowupStatus(self.followUpStatuses[1])
                .setCorrespondenceSiteType(_getTypeByLookupKey(siteView.correspondenceSiteTypeId));
        }

        /**
         * filter subSites.
         * @param site
         * @return {boolean}
         * @private
         */
        function _filterSubSites(site) {
            return self.subRecords.indexOf(site.subSiteId) === -1;
        }

        /**
         * @description to check if tab available to show it.
         * @param tabName
         * @return {boolean}
         */
        self.showTab = function (tabName) {
            return self.tabsToShow.indexOf(tabName) > -1;
        };

        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch = function () {
            self.subSearchResult = [];
            self.subSearchSelected = [];
            self.subSearch = '';
        };

        /**
         * @description add given site to (CC|TO)
         * @param to
         * @param site
         * @return {*}
         * @private
         */
        function _addSite(to, site) {
            return $timeout(function () {
                // self.partialExportList.sitesToList
                self.partialExportList['sites' + to + 'List'].push(site);
                return true;
            });
        }

        /**
         * set property for selected sub Sites.
         * @param selected
         * @param property
         * @param value
         * @private
         */
        function _setSitesProperty(selected, property, value) {
            _.map(selected, function (val, key) {
                selected[key][property] = value;
            });
        }

        /**
         * @description change site from CC to To and else.
         * @param type
         * @param site
         * @param index
         */
        self.changeSiteTo = function (type, site, index) {
            self.partialExportList['sites' + type + 'List'] = self.partialExportList['sites' + type + 'List'].concat(self.partialExportList['sites' + self.reversedMap[type] + 'List'].splice(index, 1));
        };


        /**
         * @description add single site to To.
         * @param site
         */
        self.addSiteTo = function (site) {
            _addSite('To', site)
                .then(function () {
                    self.subSearchSelected = [];
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResult, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL, _filterSubSites);
                    });
                })
        };
        /**
         * @description add single site to CC.
         * @param site
         */
        self.addSiteCC = function (site) {
            _addSite('CC', site)
                .then(function () {
                    self.subSearchSelected = [];
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResult, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL, _filterSubSites);
                    });
                });
        };

        /**
         * @description add all selected sites to To.
         * @param sites
         * @param $event
         * @param isDistributionListRecord
         */
        self.addSitesTo = function (sites, $event, isDistributionListRecord) {
            if (self.needReply(self.followupStatus) && !self.followUpStatusDate) {
                dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
                return;
            }
            _.map(sites, function (site) {
                self.addSiteTo(site);
            });
            if (isDistributionListRecord) {
                self.followUpStatusDate_DL = null;
                self.followupStatus_DL = null;
                self.subSearchSelected_DL = [];
            } else {
                self.followUpStatusDate = null;
                self.followupStatus = null;
                self.subSearchSelected = [];
            }
        };
        /**
         * @description add all selected sites to CC.
         * @param sites
         * @param $event
         * @param isDistributionListRecord
         */
        self.addSitesCC = function (sites, $event, isDistributionListRecord) {
            if (self.needReply(self.followupStatus) && !self.followUpStatusDate) {
                dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
                return;
            }
            _.map(sites, function (site) {
                self.addSiteCC(site);
            });
            if (isDistributionListRecord) {
                self.followUpStatusDate_DL = null;
                self.followupStatus_DL = null;
                self.subSearchSelected_DL = [];
            } else {
                self.followUpStatusDate = null;
                self.followupStatus = null;
                self.subSearchSelected = [];
            }
        };

        /**
         * check if need replay
         * @return {boolean}
         */
        self.needReply = function (status) {
            return (status && status.lookupStrKey === 'NEED_REPLY');
        };

        /**
         * single select to set follow up status for selected row.
         * @param site
         * @param status
         */
        self.setCurrentFollowUpStatus = function (site, status) {
            site.followupStatus = status;
            if (!self.needReply(site.followupStatus)) {
                site.followupDate = null;
            }
        };

        /**
         * @description set all followupStatus for all subSearchResult.
         */
        self.onFollowupStatusChange = function (status) {
            self.followupStatus = status;
            _setSitesProperty(self.subSearchSelected, 'followupStatus', status);
        };
        /**
         * @description set all followupDate for all subSearchResult.
         */
        self.onFollowupDateChange = function () {
            _setSitesProperty(self.subSearchSelected, 'followupDate', self.followUpStatusDate);
        };

        /**
         * @description delete bulk sites
         * @param type
         * @param $event
         */
        self.onSitesInfoDeleteBulk = function (type, $event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    var ids = _.map(self['sitesInfo' + type + 'Selected'], 'subSiteId');
                    self.partialExportList['sites' + type + 'List'] = _.filter(self.partialExportList['sites' + type + 'List'], function (site) {
                        return ids.indexOf(site.subSiteId) === -1;
                    });
                    self['sitesInfo' + type + 'Selected'] = [];
                    _concatCorrespondenceSites(false);
                });
        };

        /**
         * @description change followupStatus for selected sitesInfo.
         * @param type
         * @param status
         */
        self.onSitesFollowupStatusChange = function (type, status) {
            self['sitesInfo' + type + 'FollowupStatus'] = status;
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupStatus', status);
            if (!self.needReply(status)) {
                _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate', null);
                self['sitesInfo' + type + 'Selected'] = [];
                self['sitesInfo' + type + 'FollowupStatus'] = null;
            }
        };
        /**
         * @description change date for selected sitesInfo.
         */
        self.onSitesInfoFollowupDateChange = function (type) {
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate', self['sitesInfo' + type + 'FollowupStatusDate']);
        };
        /**
         * @description close partial export dialog
         */
        self.closePartialExportDialog = function () {
            dialog.cancel();
        };

        self.partialExportDocument = function () {
            self.disableExport = true;
            if (!self.partialExportList.hasSites()) {
                dialog.errorMessage(langService.get('please_select_at_least_on_correspondence_site_to_export'));
                return;
            }
            return correspondenceService
                .partialExportCorrespondence(self.correspondence, self.partialExportList, ignoreMessage)
                .then(function () {
                    return dialog.hide(self.correspondence);
                }).catch(function () {
                    self.disableExport = false;
                });
        };

        self.getCorrespondenceSites_DL = function ($event) {
            var sites = _.map(self.selectedDistributionList.distributionListMembers, function (member) {
                return member.site;
            });
            var siteViews = generator.generateCollection(sites, SiteView, self._sharedMethods);
            siteViews = generator.interceptReceivedCollection('SiteView', siteViews);

            self.subSearchResult_DL = _.filter(_.map(siteViews, _mapSubSites), _filterSubSites);

        };

        self.openLinkedDocsAttachmentDialogFromPartialExport = function ($event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('linked-docs-attachments'),
                    controller: 'linkedDocsAttachmentPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        exportOptions: self.partialExportList,
                        model: self.correspondence
                    },
                    resolve: {
                        linkedDocs: function (correspondenceService) {
                            'ngInject';
                            var info = self.correspondence.getInfo();
                            return self.isGroupExport ? correspondenceService
                                .getLinkedDocumentsByVsIdClass(info.vsId, info.documentClass) : self.partialExportList.exportItems.RELATED_BOOKS;
                        }
                    }
                })
                .then(function (selectedCorrespondences) {
                    self.partialExportList.setAttachmentLinkedDocs(selectedCorrespondences);
                })
                .catch(function (selectedCorrespondences) {
                    self.partialExportList.setAttachmentLinkedDocs(selectedCorrespondences);
                })
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         * @param fieldType
         */
        self.preventSearchKeyDown = function ($event, fieldType) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                // if enter key pressed, load from server with search text
                if (code === 13) {
                    if (fieldType === 'mainSiteSimple' || fieldType === 'mainSiteAdvanced') {
                        self.loadMainSitesRecords($event);
                    } else if (fieldType === 'subSiteSimple') {
                        self.loadSubSitesRecords($event).then(function () {
                            angular.element($event.target).focus();
                        });
                    }
                }
                // prevent keydown except arrow up and arrow down keys
                else if (code !== 38 && code !== 40) {
                    $event.stopPropagation();
                }
            }
        };

        /**
         * @description Get main correspondence sites on change of correspondence site type.
         * @param $event
         */
        self.onSiteTypeSimpleChange = function ($event) {
            self.mainSites = [];
            self.mainSitesCopy = angular.copy(self.mainSites);
            self.subSearchResult = [];
            self.subSearchResultCopy = angular.copy(self.subSearchResult);
            self.selectedMainSiteSimple = null;

            if (self.selectedSiteTypeSimple.id) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteTypeSimple ? self.selectedSiteTypeSimple.lookupKey : null,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    _selectDefaultMainSiteAndGetSubSites();
                });
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.onMainSiteChangeSimple = function ($event) {
            self.subSearchResult = [];
            self.subSearchResultCopy = angular.copy(self.subSearchResult);
            self.subSearchSelected = []
            self.simpleSubSiteResultSearchText = '';
            self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);

            if (!self.selectedMainSiteSimple) {
                return;
            }
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteTypeSimple ? self.selectedSiteTypeSimple.lookupKey : null,
                parent: self.selectedMainSiteSimple ? self.selectedMainSiteSimple.id : null,
                criteria: null,
                excludeOuSites: true
            }).then(function (result) {
                self.subSearchResultCopy = angular.copy(_.map(result, _mapSubSites));
                self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSubSites);

                self.subSearchSelected = [];
                if (self.subSearchResult.length === 1) {
                    self.subSearchSelected.push(self.subSearchResult[0]);
                }

                // bind sub site search
                if (self.isSimpleCorrespondenceSiteSearchType) {
                    self.simpleSubSiteResultSearchText = '';
                    self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                }
            });
        };

        /**
         * @description request service for loading dropdown records with searchText
         * @param $event
         */
        self.loadMainSitesRecords = function ($event) {
            var searchText = self.isSimpleCorrespondenceSiteSearchType ? self.mainSiteSimpleSearchText : self.mainSiteAdvancedSearchText,
                siteType = self.isSimpleCorrespondenceSiteSearchType ? self.selectedSiteTypeSimple : self.selectedSiteTypeAdvanced,
                excludeOUSites = false;

            if (searchText) {
                siteType = siteType ? (siteType.hasOwnProperty('lookupKey') ? siteType.lookupKey : siteType) : null;
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: siteType,
                    criteria: searchText,
                    excludeOuSites: excludeOUSites
                }).then(function (result) {
                    if (result.length) {
                        // self.subSearchResult = [];
                        var availableMainSitesIds = _.map(self.mainSitesCopy, 'id');
                        result = _.filter(result, function (corrSite) {
                            return availableMainSitesIds.indexOf(corrSite.id) === -1;
                        });
                        self.mainSites = self.mainSites.concat(result);
                        self.mainSitesCopy = angular.copy(self.mainSites);
                        // _selectDefaultMainSiteAndGetSubSites();
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
            return correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteTypeSimple ? self.selectedSiteTypeSimple.lookupKey : null,
                parent: self.selectedMainSiteSimple ? self.selectedMainSiteSimple.id : null,
                criteria: self.simpleSubSiteResultSearchText,
                excludeOuSites: true
            }).then(function (result) {
                if (result.length) {
                    var availableSubSitesIds = _.map(self.subSearchResultCopy, 'subSiteId');
                    result = _.filter(result, function (corrSite) {
                        return availableSubSitesIds.indexOf(corrSite.id) === -1;
                    });
                    result = _.filter(_.map(result, _mapSubSites), _filterSubSites);

                    self.subSearchResult = self.subSearchResult.concat(result);
                    self.subSearchResultCopy = angular.copy(self.subSearchResult);

                    self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                } else {
                    self.subSearchResult = angular.copy(self.subSearchResultCopy);
                }
                return self.subSearchResult;
            }).catch(function (error) {
                return self.subSearchResult = angular.copy(self.subSearchResultCopy);
            });
        };


        var _selectDefaultMainSiteAndGetSubSites = function () {
            if (self.selectedSiteTypeSimple && self.mainSites && self.mainSites.length > 0) {
                if (configurationService.SELECT_MAIN_SITE_IF_ONLY_ONE && self.mainSites.length === 1) {
                    self.selectedMainSiteSimple = self.mainSites[0];
                } else if (self.selectedSiteTypeSimple.lookupKey === 1) {
                    self.selectedMainSiteSimple = _.find(self.mainSites, function (site) {
                        return site.id === 10000000;
                    });
                }
                self.selectedMainSiteSimple ? self.onMainSiteChangeSimple() : null;
            }
        };

        /**
         * @description Check if sub site search has text and is enabled
         * @returns {string|boolean}
         */
        self.isSubSiteSearchEnabled = function () {
            return self.simpleSubSiteResultSearchText;
        };

        /**
         * @description drop down values for sub site result search
         * @param searchText
         * @returns {Array}
         */
        self.getSimpleSubSearchOptions = function (searchText) {
            if (searchText) {
                return _.filter(self.simpleSubSiteSearchCopy, function (simpleSearchSite) {
                    return simpleSearchSite.getTranslatedName().toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
                });
            }
            return self.simpleSubSiteSearchCopy;
        };

        self.onSimpleSubSiteSelectedChange = function (subSite) {
            if (subSite) {
                self.subSearchResult = _.filter(self.subSearchResultCopy, function (resultCopy) {
                    return resultCopy.subSiteId === subSite.subSiteId;
                });
            } else
                self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
        };

        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch_DL = function () {
            self.subSearchResult_DL = [];
            self.subSearchSelected_DL = [];
            self.selectedDistributionList = null;
        };

        function _setSitesTypeIfInternalOutgoingActive() {
            var info = self.correspondence.getInfo();
            if (self.isInternalOutgoingEnabled && self.correspondenceSiteTypes) {
                self.correspondenceSiteTypes.map(siteType => {
                    // if adding internal outgoing disable all site types except internal
                    if (info.documentClass === 'outgoing' && self.correspondence.isInternal && !siteType.isInternalSiteType()) {
                        siteType.disabled = true;
                        // only internal correspondence site will be selected by default
                        self.selectedSiteTypeSimple = _getTypeByLookupKey(configurationService.INTERNAL_CORRESPONDENCE_SITES_TYPE);
                    }
                    return siteType;
                });
                if (info.documentClass === 'outgoing' && self.correspondence.isInternal) {
                    self.onSiteTypeSimpleChange(null);
                }
            }
        }

        $timeout(function () {
            _setSitesTypeIfInternalOutgoingActive();
        })
        // if selective export from global settings, change export type because in this popup, default is group export
        if (!self.isGroupExport) {
            self.onChangeExportType();
        }
    });
};
