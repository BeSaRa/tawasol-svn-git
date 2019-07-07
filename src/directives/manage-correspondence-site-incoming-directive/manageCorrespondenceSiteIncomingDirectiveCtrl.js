module.exports = function (app) {
    app.controller('manageCorrespondenceSiteIncomingDirectiveCtrl', function (correspondenceViewService,
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
                                                                              generator,
                                                                              correspondenceService,
                                                                              toast,
                                                                              rootEntity,
                                                                              gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSiteIncomingDirectiveCtrl';
        self.documentClass = 'incoming';

        self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
        self.correspondenceSiteTypesCopy = angular.copy(self.correspondenceSiteTypes);
        self.mainSites = [];
        self.mainSitesCopy = angular.copy(self.mainSites);

        self.isSimpleCorrespondenceSiteSearchType = rootEntity.getGlobalSettings().simpleCorsSiteSearch;

        self.siteTypeSimpleSearchText = '';
        self.siteTypeAdvancedSearchText = '';
        self.mainSiteSimpleSearchText = '';

        self.selectedSiteTypeSimple = null;
        self.selectedSiteTypeAdvanced = null;

        self.mainSiteAdvancedSearchText = '';
        self.simpleSubSiteResultSearchText = '';

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
        // followup statues
        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);
        // selected followup Status.
        self.followupStatus = null;
        // current for need replay
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

        self.selectedMainSiteSimple = null;

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
                self.subRecords = _.map([].concat([self.site]), 'subSiteId');
                return;
            }
            return $timeout(function () {
                return self.subRecords = _.map([].concat([self.site]), 'subSiteId');
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
            // if (!self.isValidSite(site)) {
            //     // dialog.errorMessage(langService)
            //     return;
            // }
            _addSite('To', site)
                .then(function () {
                    self.subSearchSelected = [];
                    self.simpleSubSiteResultSearchText = '';

                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
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
                    self.simpleSubSiteResultSearchText = '';

                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                    });
                });
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
         */
        self.addSitesCC = function (sites) {
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
         * @description Get main correspondence sites on change of correspondence site type.
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

        self.onSiteTypeChangeAdvanced = function ($event) {
            var siteType = self.selectedSiteTypeAdvanced && self.selectedSiteTypeAdvanced.hasOwnProperty('lookupKey')
                ? self.selectedSiteTypeAdvanced.lookupKey
                : self.selectedSiteTypeAdvanced;
            if (typeof siteType !== 'undefined' && siteType !== null && siteType === 1) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: siteType,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSearchResult = [];
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    self.selectedMainSiteAdvanced = null;
                    //_selectDefaultMainSiteAndGetSubSites();
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
                // self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
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
                //if (!self.selectedSiteTypeAdvanced){
                self.selectedSiteTypeAdvanced = _mapTypes(_getTypeByLookupKey(self.selectedMainSiteAdvanced.correspondenceSiteTypeId));
                //}
                self.onSubSiteSearchAdvanced(true);
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
            self.subSiteAdvancedSearchText = '';
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

        self.onSiteFollowupStatusChange = function (status) {
            if (!self.needReply(status)) {
                self.site.followupDate = null;
            } else {
                if (self.site.followupStatus.lookupStrKey !== 'NEED_REPLY')
                    self.site.followupStatus = null;
            }
            self.site.followupStatus = status;
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
                            self.defaultSubSearch = angular.copy(_.map(result, _mapSubSites));
                            self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSubSites);
                            resolve(self.subSearchResult);
                        });
                    }, 500);
                });
            }
            return pendingSearch;
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

        /**
         * replace correspondence Site
         * @param site
         */
        self.replaceSite = function (site) {
            if (self.needReply(site.followupStatus) && !(site.followupDate))
                return toast.error(langService.get('sites_please_select_followup_date'));
            var promise;
            if (self.site && self.site.mainSiteId) {
                promise = dialog
                    .confirmMessage(langService.get('correspondence_site_will_change'))
                    .then(function () {
                        self.site = site;
                        return true;
                    });
            } else {
                promise = $timeout(function () {
                    self.site = site;
                });
            }
            promise.then(function () {
                _concatCorrespondenceSites(true).then(function () {
                    self.subSearchResult = _.filter(self.defaultSubSearch, _filterSubSites);
                });
            });
        };

        self.deleteSite = function () {
            dialog
                .confirmMessage(langService.get('confirm_delete_correspondence_site').change({name: self.site.getTranslatedName()}))
                .then(function () {
                    self.site = null;
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.defaultSubSearch, _filterSubSites);
                    });
                });
        };

        $scope.$watch(function () {
            return self.emptySubRecords;
        }, function (value) {
            if (value) {
                self.subRecords = _concatCorrespondenceSites(true);
                self.subSearchResult = [];
                self.emptySubRecords = false;
                self.selectedSiteTypeSimple = null;
                self.selectedMainSiteSimple = null;
                self.selectedSiteTypeAdvanced = null;
                self.mainSiteAdvancedSearchText = '';
                self.subSiteAdvancedSearchText = '';
                self.selectedSimpleSub = null;
                self.simpleSubSearchText = '';
            }
        });

        self.getSortingKey = function (property, modelType) {
            generator.getColumnSortingKey(property, modelType);
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
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };


        /**
         * @description filter the dropdown with searchText or request service if searched record not found
         * @param $event
         * @param fieldType
         */
        self.filterDropdownRecords = function ($event, fieldType) {
            $timeout(function () {
                if (fieldType === 'mainSiteSimple' || fieldType === 'mainSiteAdvanced') {
                    _filterSearchMainSites();
                }
            })
        };

        var _filterSearchMainSites = function () {
            var searchText = self.isSimpleCorrespondenceSiteSearchType ? self.mainSiteSimpleSearchText : self.mainSiteAdvancedSearchText,
                siteType = self.isSimpleCorrespondenceSiteSearchType ? self.selectedSiteTypeSimple : self.selectedSiteTypeAdvanced,
                excludeOUSites = false;

            var searchResult = gridService.searchGridData({
                searchText: searchText,
                searchColumns: {
                    arName: langService.current === 'ar' ? 'arName' : '',
                    enName: langService.current === 'en' ? 'enName' : '',
                }
            }, self.mainSitesCopy);
            if (searchResult && searchResult.length) {
                self.mainSites = searchResult;
                _selectDefaultMainSiteAndGetSubSites();
            } else {
                if (searchText) {
                    siteType = siteType ? (siteType.hasOwnProperty('lookupKey') ? siteType.lookupKey : siteType) : null;
                    correspondenceViewService.correspondenceSiteSearch('main', {
                        type: siteType,
                        criteria: searchText,
                        excludeOuSites: excludeOUSites
                    }).then(function (result) {
                        if (result.length) {
                            self.subSearchResult = [];
                            self.mainSites = self.mainSites.concat(result);
                            self.mainSitesCopy = angular.copy(self.mainSites);

                            _selectDefaultMainSiteAndGetSubSites();
                        } else {
                            self.mainSites = [];
                        }
                    }).catch(function (error) {
                        self.mainSites = angular.copy(self.mainSitesCopy);
                    });
                }
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

    });
};
