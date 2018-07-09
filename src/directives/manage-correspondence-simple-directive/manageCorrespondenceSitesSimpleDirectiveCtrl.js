module.exports = function (app) {
    app.controller('manageCorrespondenceSitesSimpleDirectiveCtrl', function (correspondenceViewService,
                                                                       langService,
                                                                       dialog,
                                                                       moment,
                                                                       $scope,
                                                                       Site,
                                                                       lookupService,
                                                                       CorrespondenceSiteType,
                                                                       LangWatcher,
                                                                       $timeout,
                                                                       $q,
                                                                       _,
                                                                       correspondenceService,
                                                                       generator,
                                                                       SiteView,
                                                                       rootEntity,
                                                                       toast) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSitesSimpleDirectiveCtrl';

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

        // all correspondence site types
        // self.correspondenceSiteTypes = correspondenceSiteTypeService.correspondenceSiteTypes;
        self.documentClass = null;
        $timeout(function () {
            self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
            self.correspondenceSiteTypes.push(new CorrespondenceSiteType({
                id: null,
                arName: langService.getKey('not_found', 'ar'),
                enName: langService.getKey('not_found', 'en')
            }));

            self.distributionLists = angular.copy(correspondenceService.getLookup(self.documentClass, 'distributionList'));
        });

        // model to search on correspondence sites type
        self.typeSearch = '';
        self.selectedType = null;
        // model for search on main correspondence sites
        self.mainSearch = '';
        // selected mainCorrespondence sites
        self.selectedMain = null;
        // model for search on sub correspondence sites
        self.subSearch = '';
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
         * private method to search in the correspondence type.
         * @param search
         * @param type
         * @return {boolean}
         * @private
         */
        function _matchType(search, type) {
            return (
                type.arName.trim().toLowerCase().indexOf(search.trim().toLowerCase()) !== -1 ||
                type.enName.trim().toLowerCase().indexOf(search.trim().toLowerCase()) !== -1
            );
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
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
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
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
                    });
                });
        };

        var _resetSelectedData = function (isDistributionListRecord) {
            if (isDistributionListRecord) {
                self.followUpStatusDate_DL = null;
                self.followupStatus_DL = null;
                self.subSearchSelected_DL = [];
            }
            else {
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
                }
                else {
                    _.map(sitesWithoutNeedReply, function (site) {
                        self.addSiteTo(site);
                    });
                    _resetSelectedData(isDistributionListRecord);
                }
            }
            else {
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
                }
                else {
                    _.map(sitesWithoutNeedReply, function (site) {
                        self.addSiteTo(site);
                    });
                    _resetSelectedData(isDistributionListRecord);
                }
            }
            else {
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
         * search in correspondence types and retrieve the filtered result.
         * @param typeSearch
         * @return {Array}
         */
        self.onTypeSearch = function (typeSearch) {
            var defer = $q.defer(), result;
            if (!typeSearch.trim().length) {
                result = [];
            } else {
                result = _.map(_.filter(self.correspondenceSiteTypes, function (type) {
                    return _matchType(typeSearch, type);
                }), _mapTypes);
            }
            $timeout(function () {
                defer.resolve(result);
            }, Math.random() * 1000, false);
            return defer.promise;
        };
        /**
         * @description Get main correspondence sites on change of correspondence site type.
         * @param $event
         */
        self.onSiteTypeChange = function ($event) {
            if (self.selectedSiteType.id) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;
                });
            }
            else {
                self.mainSites = self.subSearchResult = self.subSearchResultCopy = [];
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.selectedMainSite = null;
        self.getSubSites = function ($event) {
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                criteria: null,
                excludeOuSites: false
            }).then(function (result) {
                self.subSearchResultCopy = angular.copy(_.map(result, _mapSubSites));
                self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSubSites);
            });
        };

        /**
         * search in MainCorrespondenceSites and retrieve the filtered result.
         * @return {Array}
         * @param mainSearch
         */
        self.onMainSearch = function (mainSearch) {
            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();
                if (self.mainSearch.trim().length < 2)
                    return [];

                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;

                    $timeout(function () {
                        refreshDebounce();
                        correspondenceViewService.correspondenceSiteSearch('main', {
                            type: self.selectedType ? self.selectedType.lookupKey : null,
                            criteria: mainSearch
                        }).then(function (result) {
                            resolve(_.map(result, _mapSite));
                        });
                    }, 500);
                });
            }
            return pendingSearch;
        };
        /**
         * @description set selected type when not selected after select main site.
         * @param main
         */
        self.onMainChange = function (main) {
            if (main && !self.selectedType)
                self.selectedType = _mapTypes(_getTypeByLookupKey(main.correspondenceSiteTypeId));
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
            self.subSearch = '';
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
            var sitesToSetFollowupDate = _.filter(self.subSearchSelected, function(site){
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
            var sitesToSetFollowupDate = _.filter(self.subSearchSelected_DL, function(site){
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
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
                    });
                });
        };
        /**
         * search in sub correspondence sites related to mainSites.
         * @return {*}
         */
        self.onSubSearch = function () {
            if (self.subSearch.length < 3) {
                self.subSearchResult = [];
                return;
            }

            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();

                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;

                    $timeout(function () {
                        refreshDebounce();
                        correspondenceViewService.correspondenceSiteSearch('sub', {
                            type: self.selectedType ? self.selectedType.lookupKey : null,
                            parent: self.selectedMain ? self.selectedMain.id : null,
                            criteria: self.subSearch
                        }).then(function (result) {
                            if (self.subSearch.length < 3) {
                                self.subSearchResult = [];
                                return;
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

    });
};