module.exports = function (app) {
    app.controller('manageCorrespondenceSitesDirectiveCtrl', function (correspondenceViewService,
                                                                       langService,
                                                                       dialog,
                                                                       moment,
                                                                       $scope,
                                                                       Site,
                                                                       lookupService,
                                                                       CorrespondenceSiteType,
                                                                       $interval,
                                                                       LangWatcher,
                                                                       configurationService,
                                                                       $timeout,
                                                                       $q,
                                                                       _,
                                                                       correspondenceService,
                                                                       generator,
                                                                       SiteView,
                                                                       rootEntity,
                                                                       toast,
                                                                       gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSitesDirectiveCtrl';

        self.tabsToShow = [
            'correspondenceSites',
            'distributionLists'
        ];
        self.showTab = function (tabName) {
            return self.tabsToShow.indexOf(tabName) > -1;
        };
        self.currentTab = 'correspondenceSites';
        self.setCurrentTab = function (tabName) {
            self.currentTab = tabName;
        };
        self.isSimpleCorrespondenceSiteSearchType = rootEntity.getGlobalSettings().simpleCorsSiteSearch;

        self.siteTypeSimpleSearchText = '';
        self.siteTypeAdvancedSearchText = '';
        self.mainSiteSimpleSearchText = '';
        self.mainSiteAdvancedSearchText = '';
        self.simpleSubSiteResultSearchText = '';

        self.documentClass = null;
        $timeout(function () {
            self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
            self.correspondenceSiteTypesCopy = angular.copy(self.correspondenceSiteTypes);

            self.distributionLists = angular.copy(correspondenceService.getLookup(self.documentClass, 'distributionList'));

            self.mainSites = [];
            self.mainSitesCopy = angular.copy(self.mainSites);
        });

        self.selectedSiteTypeSimple = null;
        self.selectedSiteTypeAdvanced = null;

        // selected mainCorrespondence sites
        self.selectedMainSiteAdvanced = null;
        // selected subCorrespondence sites from internal search box
        self.selectedSimpleSub = null;
        // model for search on sub correspondence sites
        self.subSiteAdvancedSearchText = '';
        // sub Search result
        self.subSearchResult = [];
        // sub correspondence selected from result
        self.subSearchSelected = [];
        // sites info cc
        self.sitesInfoCC = [];
        // sites info to
        self.sitesInfoTo = [];
        // book vsId
        self.vsId = null;
        // followup statuses
        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);
        // selected followup Status.
        self.followupStatus = null;
        // current for need reply
        self.minDate = _createCurrentDate(1);
        // all sub correspondence sites
        self.subRecords = _concatCorrespondenceSites(true);
        // default followupStatusDate
        self.followUpStatusDate = null;
        // selected siteInfoTo
        self.sitesInfoToSelected = [];
        // selected siteInfoCC
        self.sitesInfoCCSelected = [];
        // default sites info to followupStatus
        self.sitesInfoToFollowupStatus = null;
        // default sites info CC followupStatus
        self.sitesInfoCCFollowupStatus = null;
        // default sites info to followupStatusDate
        self.sitesInfoToFollowupStatusDate = null;
        // default sites info to followupStatusDate
        self.sitesInfoCCFollowupStatusDate = null;

        // sub Search result for distribution list
        self.subSearchResult_DL = [];
        // sub correspondence selected from result for distribution list
        self.subSearchSelected_DL = [];
        // selected followup Status for distribution list
        self.followupStatus_DL = null;
        // get the main sites for selected correspondence site type
        self.selectedDistributionList = null;

        self.selectedMainSiteSimple = null;

        self.isSearchByDLSiteType = false;
        self.selectedSiteType_DL = null;
        self.siteType_DLSearchText = '';

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
                self.subRecords = _.map([].concat(self.sitesInfoTo, self.sitesInfoCC), 'subSiteId');
                return;
            }
            return $timeout(function () {
                return self.subRecords = _.map([].concat(self.sitesInfoTo, self.sitesInfoCC), 'subSiteId');
            });
        }

        // reversed map for sites.
        self.reversedMap = {
            CC: 'To',
            To: 'CC'
        };
        // watch the language for any changes from current user.
        LangWatcher($scope);

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
                            return (self.sitesInfoTo.length + 21);
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
                            return (self.sitesInfoCC.length + 21);
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

        // private variables to debounce the request.
        var pendingSearch, cancelSearch = angular.noop, lastSearch;

        /**
         * to refresh debounce (reset).
         */
        function refreshDebounce() {
            lastSearch = 0;
            pendingSearch = null;
            cancelSearch = angular.noop;
        }

        /**
         * Debounce if querying faster than 300ms
         */
        function debounceSearch() {
            var now = new Date().getMilliseconds();
            lastSearch = lastSearch || now;

            return ((now - lastSearch) < 300);
        }

        /**
         * map the type when get result.
         * @param type
         * @return {*}
         * @private
         */
        function _mapTypes(type) {
            type.display = type[langService.current + 'Name'];
            return type;
        }

        /**
         * map current name when get result.
         * @param site
         * @return {*}
         * @private
         */
        function _mapSite(site) {
            site.display = site[langService.current + 'Name'];
            return site;
        }

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
         * @description add given site to (CC|TO)
         * @param to
         * @param site
         * @return {*}
         * @private
         */
        function _addSite(to, site) {
            return $timeout(function () {
                self['sitesInfo' + to].push(site);
                return true;
            });
        }

        /**
         * @description add single site to To.
         * @param site
         */
        self.addSiteTo = function (site) {
            if (self.needReply(site.followupStatus) && !(site.followupDate))
                return toast.error(langService.get('sites_please_select_followup_date'));
            _addSite('To', site)
                .then(function () {
                    self.subSearchSelected = [];
                    self.simpleSubSiteResultSearchText = '';
                    /*self['sitesInfoToFollowupStatus'] = null;
                    self['sitesInfoToFollowupStatusDate'] = null;*/
                    self.resetToStatusAndDate();
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
                        self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                    });
                })
        };
        /**
         * @description add single site to CC.
         * @param site
         */
        self.addSiteCC = function (site) {
            if (self.needReply(site.followupStatus) && !(site.followupDate))
                return toast.error(langService.get('sites_please_select_followup_date'));
            _addSite('CC', site)
                .then(function () {
                    self.subSearchSelected = [];
                    self.simpleSubSiteResultSearchText = '';
                    /*self['sitesInfoCCFollowupStatus'] = null;
                    self['sitesInfoCCFollowupStatusDate'] = null;*/
                    self.resetCCStatusAndDate();
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
                        self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                    });
                });
        };

        var _resetSelectedData = function (isDistributionListRecord) {
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
         * @description add all selected sites to To.
         * @param sites
         * @param $event
         * @param isDistributionListRecord
         */
        self.addSitesTo = function (sites, $event, isDistributionListRecord) {
            var sitesWithoutNeedReply = _.filter(sites, function (site) {
                return !self.needReply(site.followupStatus);
            });
            /*sitesWithoutNeedReply = [] means all sites need reply
            * if followupStatus is needReply and no date selected and all sites need reply, show alert
            * otherwise add sites without need reply
            * */
            if (self.needReply(self.followupStatus) && !self.followUpStatusDate) {
                if (sitesWithoutNeedReply.length === 0) {
                    dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
                    return;
                } else {
                    dialog.confirmMessage(langService.get('sites_with_need_reply_missing_date_confirm_skip'))
                        .then(function () {
                            _.map(sitesWithoutNeedReply, function (site) {
                                self.addSiteTo(site);
                            });
                            _resetSelectedData(isDistributionListRecord);
                        });
                }
            } else {
                _.map(sites, function (site) {
                    self.addSiteTo(site);
                });
                _resetSelectedData(isDistributionListRecord);
            }
        };
        /**
         * @description add all selected sites to CC.
         * @param sites
         * @param $event
         * @param isDistributionListRecord
         */
        self.addSitesCC = function (sites, $event, isDistributionListRecord) {
            var sitesWithoutNeedReply = _.filter(sites, function (site) {
                return !self.needReply(site.followupStatus);
            });
            /*sitesWithoutNeedReply = [] means all sites need reply
            * if followupStatus is needReply and no date selected and all sites need reply, show alert
            * otherwise add sites without need reply
            * */
            if (self.needReply(self.followupStatus) && !self.followUpStatusDate) {
                if (sitesWithoutNeedReply.length === 0) {
                    dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
                    return;
                } else {
                    dialog.confirmMessage(langService.get('sites_with_need_reply_missing_date_confirm_skip'))
                        .then(function () {
                            _.map(sitesWithoutNeedReply, function (site) {
                                self.addSiteCC(site);
                            });
                            _resetSelectedData(isDistributionListRecord);
                        });
                }
            } else {
                _.map(sites, function (site) {
                    self.addSiteCC(site);
                });
                _resetSelectedData(isDistributionListRecord);
            }
        };
        /**
         * @description change site from CC to To and else.
         * @param type
         * @param site
         * @param index
         */
        self.changeSiteTo = function (type, site, index) {
            self['sitesInfo' + type] = self['sitesInfo' + type].concat(self['sitesInfo' + self.reversedMap[type]].splice(index, 1));
        };

        /**
         * @description Get main correspondence sites on change of correspondence site type in simple search.
         * @param $event
         */
        self.onSiteTypeSimpleChange = function ($event) {
            if (self.selectedSiteTypeSimple) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteTypeSimple ? self.selectedSiteTypeSimple.lookupKey : null,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSearchResult = [];
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    self.selectedMainSiteSimple = null;
                    _selectDefaultMainSiteAndGetSubSites();
                });
            } else {
                self.mainSites = [];
                self.mainSitesCopy = angular.copy(self.mainSites);
                self.subSearchResult = [];
                self.subSearchResultCopy = angular.copy(self.subSearchResult);
                self.selectedMainSiteSimple = null;
            }
        };

        /**
         * @description Get main correspondence sites on change of correspondence site type in advanced search.
         * @param $event
         */
        self.onSiteTypeChangeAdvanced = function ($event) {
            var siteType = self.selectedSiteTypeAdvanced && self.selectedSiteTypeAdvanced.hasOwnProperty('lookupKey')
                ? self.selectedSiteTypeAdvanced.lookupKey
                : self.selectedSiteTypeAdvanced;
            // if internal site type or g2g site type, load main sites
            if (typeof siteType !== 'undefined' && siteType !== null && (configurationService.CORRESPONDENCE_SITES_TYPES_LOOKUPS.indexOf(siteType) !== -1)) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: siteType,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSearchResult = [];
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    self.selectedMainSiteAdvanced = null;
                    _selectDefaultMainSiteAndGetSubSitesAdvanced();
                });
            } else {
                self.subSearchResult = [];
                self.mainSites = [];
                self.mainSitesCopy = angular.copy(self.mainSites);
                self.selectedMainSiteAdvanced = null;
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.onMainSiteChangeSimple = function ($event) {
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteTypeSimple ? self.selectedSiteTypeSimple.lookupKey : null,
                parent: self.selectedMainSiteSimple ? self.selectedMainSiteSimple.id : null,
                criteria: null,
                excludeOuSites: false
            }).then(function (result) {
                self.subSearchResultCopy = angular.copy(_.map(result, _mapSubSites));
                self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSubSites);

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
         * @description set selected type when not selected after select main site.
         */
        self.onMainSiteChangeAdvanced = function () {
            if (!!self.selectedMainSiteAdvanced) {
                if (!self.selectedSiteTypeAdvanced) {
                    self.selectedSiteTypeAdvanced = _mapTypes(_getTypeByLookupKey(self.selectedMainSiteAdvanced.correspondenceSiteTypeId));
                }
                self.onSubSiteSearchAdvanced(true);
            }
        };

        /**
         * @description drop down values for sub site search
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
         * check if need replay
         * @return {boolean}
         */
        self.needReply = function (status) {
            return (status && status.lookupStrKey === 'NEED_REPLY');
        };
        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch = function () {
            self.subSearchResult = [];
            self.subSearchSelected = [];
            self.subSiteAdvancedSearchText = '';
            self.selectedMainSiteSimple = null;
            self.resetSearchStatusAndDate();
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
            var sitesToSetFollowupDate = _.filter(self.subSearchSelected, function (site) {
                return self.needReply(site.followupStatus);
            });
            _setSitesProperty(sitesToSetFollowupDate, 'followupDate', self.followUpStatusDate);
        };

        /**
         * @description set all followupStatus for all subSearchResult.
         */
        self.onFollowupStatusChange_DL = function (status) {
            self.followupStatus_DL = status;
            _setSitesProperty(self.subSearchSelected_DL, 'followupStatus', status);
        };
        /**
         * @description set all followupDate for all subSearchResult.
         */
        self.onFollowupDateChange_DL = function () {
            var sitesToSetFollowupDate = _.filter(self.subSearchSelected_DL, function (site) {
                return self.needReply(site.followupStatus);
            });
            _setSitesProperty(sitesToSetFollowupDate, 'followupDate', self.followUpStatusDate_DL);
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
         * @description change date for selected sitesInfo.
         */
        self.onSitesInfoFollowupDateChange = function (type) {
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate', self['sitesInfo' + type + 'FollowupStatusDate']);
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
         * @description delete bulk sites
         * @param type
         * @param $event
         */
        self.onSitesInfoDeleteBulk = function (type, $event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    // TODO: need to refactor .
                    var ids = _.map(self['sitesInfo' + type + 'Selected'], 'subSiteId');
                    self['sitesInfo' + type] = _.filter(self['sitesInfo' + type], function (site) {
                        return ids.indexOf(site.subSiteId) === -1;
                    });
                    self['sitesInfo' + type + 'Selected'] = [];

                    /*                    self['sitesInfo' + type + 'FollowupStatus'] = null;
                                        self['sitesInfo' + type + 'FollowupStatusDate'] = null;*/

                    var method = 'reset' + type + 'StatusAndDate';
                    self[method]();


                    _concatCorrespondenceSites(true).then(function () {
                        if (self.selectedMainSiteSimple) {
                            self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        }
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
                        self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                    });
                });
        };
        /**
         * search in sub correspondence sites related to mainSites.
         * @return {*}
         */
        self.onSubSiteSearchAdvanced = function (skipSubSiteText) {
            if (!skipSubSiteText) {
                if (self.subSiteAdvancedSearchText.length < 3) {
                    self.subSearchResult = [];
                    return;
                }
            } else {
                refreshDebounce();
            }
            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();

                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;

                    $timeout(function () {
                        refreshDebounce();
                        correspondenceViewService.correspondenceSiteSearch('sub', {
                            type: self.selectedSiteTypeAdvanced ? self.selectedSiteTypeAdvanced.lookupKey : null,
                            parent: self.selectedMainSiteAdvanced ? self.selectedMainSiteAdvanced.id : null,
                            criteria: self.subSiteAdvancedSearchText
                        }).then(function (result) {
                            if (!skipSubSiteText) {
                                if (self.subSiteAdvancedSearchText.length < 3) {
                                    self.subSearchResult = [];
                                    return;
                                }
                            }
                            self.subSearchResultCopy = angular.copy(_.map(result, _mapSubSites));
                            self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSubSites);
                            resolve(self.subSearchResult);
                        });
                    }, 500);
                });
            }
            return pendingSearch;
        };

        self.getCorrespondenceSites_DL = function ($event) {
            /*return correspondenceViewService.getCorrespondenceSitesByDistributionListId(self.selectedDistributionList)
                .then(function (result) {
                    self.subSearchResult_DL = _.filter(_.map(result, _mapSubSites), _filterSubSites);
                });*/
            var sites = _.map(self.selectedDistributionList.distributionListMembers, function (member) {
                return member.site;
            });
            var siteViews = generator.generateCollection(sites, SiteView, self._sharedMethods);
            siteViews = generator.interceptReceivedCollection('SiteView', siteViews);

            self.subSearchResult_DL_Copy = angular.copy(_.map(siteViews, _mapSubSites));
            self.subSearchResult_DL = _.filter(_.map(siteViews, _mapSubSites), _filterSubSites);

        };

        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch_DL = function () {
            self.subSearchResult_DL = [];
            self.subSearchSelected_DL = [];
            self.selectedDistributionList = null;
            self.resetSearchStatusAndDate_DL();
        };

        self.resetSearchStatusAndDate = function () {
            self['followupStatus'] = null;
            self['followUpStatusDate'] = null;
        };

        self.resetToStatusAndDate = function () {
            self['sitesInfoToFollowupStatus'] = null;
            self['sitesInfoToFollowupStatusDate'] = null;
        };

        self.resetCCStatusAndDate = function () {
            self['sitesInfoCCFollowupStatus'] = null;
            self['sitesInfoCCFollowupStatusDate'] = null;
        };

        self.resetSearchStatusAndDate_DL = function () {
            self['followupStatus_DL'] = null;
            self['followUpStatusDate_DL'] = null;
        };

        /**
         * @description to check if the given site valid or not based on needReply Status and date.
         * @param site
         * @return {boolean}
         */
        self.isValidSite = function (site) {
            var date;
            try {
                date = moment(site.followupDate);
            } catch (e) {

            }
            return self.needReply(site.followupStatus) && date.isValid();
        };

        $scope.$watch(function () {
            return self.emptySubRecords;
        }, function (value) {
            if (value) {
                self.subRecords = _concatCorrespondenceSites(true);
                self.emptySubRecords = false;
            }
        });

        $scope.$watch(function () {
            return self.emptySiteSearch;
        }, function (value) {
            if (value) {
                self.subSearchResult = [];
                self.emptySiteSearch = false;
                self.selectedSiteTypeSimple = null;
                self.selectedMainSiteSimple = null;
                self.selectedSiteTypeAdvanced = null;
                self.mainSiteAdvancedSearchText = '';
                self.subSiteAdvancedSearchText = '';
                self.selectedDistributionList = null;
                self.subSearchResult_DL = [];
                self.selectedSimpleSub = null;
                self.simpleSubSiteResultSearchText = '';
            }
        });

        self.getSortingKey = function (property, modelType) {
            generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
            $timeout(function () {
                if (fieldType === 'mainSiteSimple' || fieldType === 'mainSiteAdvanced') {
                    self.mainSites = angular.copy(self.mainSitesCopy);
                }
            })
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
                    }
                }
                // prevent keydown except arrow up and arrow down keys
                else if (code !== 38 && code !== 40) {
                    $event.stopPropagation();
                }
            }
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
                        self.subSearchResult = [];
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


        var _selectDefaultMainSiteAndGetSubSites = function () {
            if (self.selectedSiteTypeSimple && self.selectedSiteTypeSimple.lookupKey === 1) {
                self.selectedMainSiteSimple = _.find(self.mainSites, function (site) {
                    return site.id === 10000000;
                });
                self.selectedMainSiteSimple ? self.onMainSiteChangeSimple() : null;
            }
        };

        var _selectDefaultMainSiteAndGetSubSitesAdvanced = function () {
            if (self.selectedSiteTypeAdvanced && self.selectedSiteTypeAdvanced.lookupKey === 1) {
                self.selectedMainSiteAdvanced = _.find(self.mainSites, function (site) {
                    return site.id === 10000000;
                });
                self.selectedMainSiteAdvanced ? self.onMainSiteChangeAdvanced() : null;
            }
        };


        self.onChangeIsSearchByDLSiteType = function(){
            self.selectedSiteType_DL = null;
            self.selectedDistributionList = null;
            self.subSearchResult_DL = [];
            self.subSearchResult_DL_Copy = [];
        };


        self.onSiteTypeDistributionListChange = function () {
            if (self.selectedSiteType_DL) {
                correspondenceViewService.correspondenceSiteSearch('sub', {
                    type: self.selectedSiteType_DL.lookupKey,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSearchResult_DL_Copy = angular.copy(_.map(result, _mapSubSites));
                    self.subSearchResult_DL = _.filter(_.map(result, _mapSubSites), _filterSubSites);

                });
            } else {
                self.subSearchResult_DL_Copy = [];
                self.subSearchResult_DL = [];
            }
        };

    });
};
