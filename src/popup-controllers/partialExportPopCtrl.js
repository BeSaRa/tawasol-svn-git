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
        // to check if the search is simple or not
        self.isSimpleCorrespondenceSiteSearchType = rootEntity.getGlobalSettings().simpleCorsSiteSearch;
        // followup statuses
        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);

        self.isSimpleCorrespondenceSiteSearchType = true;

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
        self.selectedSiteType = null;

        self.selectedMainSite = null;

        self.subRecords = [];
        _concatCorrespondenceSites(false);
        self.exportType = 1;

        self.exportTypeList = [
            {id: 1, key: 'export_by_group'},
            {id: 2, key: 'export_by_selection'}
        ];

        self.exportOptions = self.partialExportList.getKeys();

        self.labels = _.map(self.partialExportList.getKeys(), function (label) {
            return label.toLowerCase();
        });

        self.loadRelatedThings = null;

        self.onChangeExportType = function () {
            self.partialExportList = self.partialExportList.changeExportType();
            if (self.exportType === 2) {
                correspondenceService
                    .loadRelatedThingsForCorrespondence(self.correspondence)
                    .then(function (result) {
                        self.loadRelatedThings = result;
                    });
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
         * @description Get main correspondence sites on change of correspondence site type.
         * @param $event
         */
        self.onSiteTypeChange = function ($event) {
            self.mainSites = [];
            self.subSearchResult = [];
            self.subSearchResultCopy = [];

            if (self.selectedSiteType.id) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;

                    if (result && result.length === 1) {
                        self.selectedMainSite = result[0];
                        self.getSubSites($event);
                    }
                });
            }
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
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.getSubSites = function ($event) {
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                criteria: null,
                excludeOuSites: true
            }).then(function (result) {
                self.subSearchResultCopy = angular.copy(result);
                self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSubSites);
            });
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
            if (!self.partialExportList.hasSites()) {
                dialog.errorMessage(langService.get('please_select_at_least_on_correspondence_site_to_export'));
                return;
            }
            return correspondenceService
                .partialExportCorrespondence(self.correspondence, self.partialExportList, ignoreMessage)
                .then(function () {
                    return dialog.hide(self.correspondence);
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
                            return self.exportType === 1 ? correspondenceService
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
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch_DL = function () {
            self.subSearchResult_DL = [];
            self.subSearchSelected_DL = [];
            self.selectedDistributionList = null;
        };
    });
};
