module.exports = function (app) {
    app.controller('manageCorrespondenceSitesSearchDirectiveCtrl', function (correspondenceViewService,
                                                                             langService,
                                                                             dialog,
                                                                             moment,
                                                                             $scope,
                                                                             Site_Search,
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
        self.controllerName = 'manageCorrespondenceSitesSearchDirectiveCtrl';

        self.isSimpleCorrespondenceSiteSearchType = rootEntity.getGlobalSettings().simpleCorsSiteSearch;

        self.documentClass = null;
        self.searchByMain = false;
        self.emptyResults = false;
        $timeout(function () {
            // all correspondence site types
            self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
            self.sitesInfoCC = self.sitesInfoCC || [];
            self.sitesInfoTo = self.sitesInfoTo || [];
            self.sitesInfoIncoming = self.sitesInfoIncoming || [];
            if (self.isSimpleCorrespondenceSiteSearchType && self.selectedSiteType)
                self.onSiteTypeChange();
        });

        // model to search on correspondence sites type
        self.typeSearch = '';
        //self.selectedType = null;
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
        // sites info to
        self.sitesInfoTo = [];
        // sites info cc
        self.sitesInfoCC = [];
        // site info incoming
        self.sitesInfoIncoming = [];
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
        // selected siteInfoIncoming
        self.sitesInfoIncomingSelected = [];
        // default sites info to followupStatus
        self.sitesInfoToFollowupStatus = null;
        // default sites info CC followupStatus
        self.sitesInfoCCFollowupStatus = null;
        // default sites info Incoming followupStatus
        self.sitesInfoIncomingFollowupStatus = null;
        // default sites info to followupStatusDate
        self.sitesInfoToFollowupStatusDate1 = null;
        self.sitesInfoToFollowupStatusDate2 = null;
        // default sites info cc followupStatusDate
        self.sitesInfoCCFollowupStatusDate1 = null;
        self.sitesInfoCCFollowupStatusDate2 = null;
        // default sites info incoming followupStatusDate
        self.sitesInfoIncomingFollowupStatusDate1 = null;
        self.sitesInfoIncomingFollowupStatusDate2 = null;


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
         * @description concatenate main and sub correspondence sites.
         * @param timeout
         * @return {*}
         * @private
         */
        function _concatCorrespondenceSites(timeout) {
            return $timeout(function () {
                return self.subRecords = _.map([].concat(self.sitesInfoTo, self.sitesInfoCC, self.sitesInfoIncoming), 'subSiteId');
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
            sitesInfoIncoming: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'mainArSiteText', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.sitesInfoIncoming.length + 21);
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
            return (new Site_Search())
                .mapFromSiteView(siteView)
                .setFollowupStatus(self.followUpStatuses[1])
                .setCorrespondenceSiteType(_getTypeByLookupKey(siteView.correspondenceSiteTypeId));
        }

        /**
         * @description map site from main site view
         * @param siteView
         * @return {*}
         * @private
         */
        function _mapMainSite(siteView) {
            var site = (new Site_Search())
                .mapFromMainSiteView(siteView)
                // .setFollowupStatus(self.followUpStatuses[1])
                .setCorrespondenceSiteType(_getTypeByLookupKey(siteView.correspondenceSiteTypeId));
            delete site.followupStatus;
            return site;
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
            var promise;
            delete site.followupDate1Max;
            delete site.followupDate2Min;

            if ((self.sitesInfoTo.length || self.sitesInfoCC.length || self.sitesInfoIncoming.length) && !self.searchByMain) {
                promise = dialog
                    .confirmMessage(langService.get('correspondence_site_will_change'))
                    .then(function () {

                        if (to.toLowerCase() === 'incoming') {
                            self.sitesInfoIncoming = [];
                            self.sitesInfoIncoming.push(site);
                        }
                        else {
                            self.sitesInfoTo = [];
                            self.sitesInfoCC = [];
                            self['sitesInfo' + to].push(site);
                        }
                        return true;
                    });
            }
            else {
                promise = $timeout(function () {
                    if (to.toLowerCase() === 'incoming' && self.searchByMain) {
                        self.sitesInfoIncoming = [];
                        self.sitesInfoIncoming.push(site);
                    } else if (to.toLowerCase() === 'incoming' && !self.searchByMain) {
                        self.sitesInfoIncoming.push(site);
                    } else if (self.searchByMain) {
                        self['sitesInfo' + to] = [];
                        self['sitesInfo' + to].push(site);
                    } else {
                        self['sitesInfo' + to].push(site);
                    }


                    return true;
                });
            }

            return promise.then(function (result) {
                return result;
            })
        }

        self.disableAddButton = function (site) {
            return (self.needReply(site.followupStatus) && !(site.followupDate1 && site.followupDate2));
        };

        /**
         * @description add single site to To.
         * @param site
         */
        self.addSiteTo = function (site) {
            if (self.disableAddButton(site))
                return toast.error(langService.get('select_date_range'));
            _addSite('To', site)
                .then(function () {
                    self.subSearchSelected = [];
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                    });
                })
        };
        /**
         * @description add single site to CC.
         * @param site
         */
        self.addSiteCC = function (site) {
            if (self.disableAddButton(site))
                return toast.error(langService.get('select_date_range'));
            _addSite('CC', site)
                .then(function () {
                    self.subSearchSelected = [];
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                    });
                });
        };

        self.addSiteIncoming = function (site, $event) {
            _addSite('Incoming', site)
                .then(function () {
                    self.subSearchSelected = [];
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                    });
                })
        };

        /**
         * @description add all selected sites to To.
         * @param sites
         * @param $event
         */
        self.addSitesTo = function (sites, $event) {
            if (self.needReply(self.followupStatus) && !self.followUpStatusDate) {
                dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
                return;
            }
            _.map(sites, function (site) {
                self.addSiteTo(site);
            });

            self.followUpStatusDate = null;
            self.followupStatus = null;
            self.subSearchSelected = [];

        };
        /**
         * @description add all selected sites to CC.
         * @param sites
         * @param $event
         */
        self.addSitesCC = function (sites, $event) {
            if (self.needReply(self.followupStatus) && !self.followUpStatusDate) {
                dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
                return;
            }
            _.map(sites, function (site) {
                self.addSiteCC(site);
            });
            self.followUpStatusDate = null;
            self.followupStatus = null;
            self.subSearchSelected = [];

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
            if (self.selectedSiteType && self.selectedSiteType.id) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSearchResult = [];
                    self.mainSites = result;
                    self.selectedMainSite = null;
                });
            }
            else {
                self.mainSites = [];
                self.subSearchResult = [];
                self.subSearchResultCopy = [];
                self.selectedMainSite = null;
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.selectedMainSite = null;
        self.getSubSites = function ($event) {
            if (self.searchByMain) {
                self.documentClass.toLowerCase() === 'outgoing' ? _addSite('To', _mapMainSite(self.selectedMainSite)) : _addSite('Incoming', _mapMainSite(self.selectedMainSite));
                return;
            }
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

        self.searchByMainChange = function () {
            /*if (self.searchByMain) {
                self.subSearchResult = [];
                self.subSearchResultCopy = [];
            } else {
                self.sitesInfoTo = [];
                self.sitesInfoCC = [];
                self.sitesInfoIncoming = [];
            }
            self.selectedSiteType = null;
            self.selectedMainSite = null;
            self.selectedMain = null;*/

            self.mainSearch = '';
            self.subSearch = '';
            self.selectedSiteType = null;
            self.selectedMainSite = null;
            self.selectedMain = null;
            self.subSearchResult = [];
            self.subSearchResultCopy = [];
            self.sitesInfoTo = [];
            self.sitesInfoCC = [];
            self.sitesInfoIncoming = [];
            self.subRecords = _concatCorrespondenceSites(true);
            self.onMainChange(self.selectedMain);
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
                            type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
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
            if (main && !self.selectedSiteType)
                self.selectedSiteType = _mapTypes(_getTypeByLookupKey(main.correspondenceSiteTypeId));

            if (self.searchByMain) {
                if (self.selectedMain) {
                    self.documentClass.toLowerCase() === 'outgoing' ? _addSite('To', _mapMainSite(self.selectedMain)) : _addSite('Incoming', _mapMainSite(self.selectedMain));
                }
                else {
                    if (self.documentClass.toLowerCase() === 'incoming' && self.searchByMain) {
                        self.sitesInfoIncoming = [];
                    }
                    else {
                        self['sitesInfoTo'] = [];
                    }
                }

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
         * single select to set follow up status for selected row.
         * @param site
         * @param status
         */
        self.setCurrentFollowUpStatus = function (site, status) {
            site.followupStatus = status;
            if (!self.needReply(site.followupStatus) || self.documentClass.toLowerCase() === 'incoming') {
                site.followupDate1 = null;
                site.followupDate2 = null;
            }
        };

        /**
         * @description change date for selected sitesInfo.
         */
        self.onSitesInfoFollowupDateChange = function (type, picker) {
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate' + picker, self['sitesInfo' + type + 'FollowupStatusDate' + picker]);
            self.getSitesInfoFollowupStatusMinMaxDate(type, picker);
        };

        self.getSiteFollowupStatusMinMaxDate = function (site, picker) {
            var date;
            if (picker === 1) {
                date = new Date(site.followupDate1);
                date.setDate(date.getDate() + 1);
                site.followupDate2Min = date;
            }
            else {
                date = new Date(site.followupDate2);
                date.setDate(date.getDate() - 1);
                site.followupDate1Max = date;
            }
        };

        self.getSitesInfoFollowupStatusMinMaxDate = function (type, picker) {
            var date;
            if (type === 'To') {
                if (picker === 1) {
                    date = new Date(self.sitesInfoToFollowupStatusDate1);
                    date.setDate(date.getDate() + 1);
                    self.sitesInfoToFollowupStatusDateMin = date;
                }
                else {
                    date = new Date(self.sitesInfoToFollowupStatusDate2);
                    date.setDate(date.getDate() - 1);
                    self.sitesInfoToFollowupStatusDateMax = date
                }
            }
            else if (type === 'CC') {
                if (picker === 1) {
                    date = new Date(self.sitesInfoCCFollowupStatusDate1);
                    date.setDate(date.getDate() + 1);
                    self.sitesInfoCCFollowupStatusDateMin = date;
                }
                else {
                    date = new Date(self.sitesInfoCCFollowupStatusDate2);
                    date.setDate(date.getDate() - 1);
                    self.sitesInfoCCFollowupStatusDateMax = date
                }
            }
            else if (type === 'Incoming') {
                if (picker === 1) {
                    date = new Date(self.sitesInfoIncomingFollowupStatusDate1);
                    date.setDate(date.getDate() + 1);
                    self.sitesInfoIncomingFollowupStatusDateMin = date;
                }
                else {
                    date = new Date(self.sitesInfoIncomingFollowupStatusDate2);
                    date.setDate(date.getDate() - 1);
                    self.sitesInfoIncomingFollowupStatusDateMax = date
                }
            }
        };

        /**
         * @description change followupStatus for selected sitesInfo.
         * @param type
         * @param status
         */
        self.onSitesFollowupStatusChange = function (type, status) {
            self['sitesInfo' + type + 'FollowupStatus'] = status;
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupStatus', status);
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate1', null);
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate2', null);
            if (!self.needReply(status)) {
                //_setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate', null);
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
                    _concatCorrespondenceSites(false).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
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
                            type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
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

        $scope.$watch(function () {
            return self.emptySubRecords;
        }, function (value) {
            if (value) {
                self.mainSearch = '';
                self.subSearch = '';
                self.selectedSiteType = null;
                self.selectedMainSite = null;
                self.selectedMain = null;
                self.subSearchResult = [];
                self.subSearchResultCopy = [];
                self.sitesInfoTo = [];
                self.sitesInfoCC = [];
                self.sitesInfoIncoming = [];
                self.subRecords = _concatCorrespondenceSites(true);
                self.emptySubRecords = false;
            }
        });

    });
};