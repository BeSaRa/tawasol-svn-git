module.exports = function (app) {
    app.controller('manageDistributionListDirectiveCtrl', function (correspondenceViewService,
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
                                                                    correspondenceSiteTypeService,
                                                                    rootEntity) {

        'ngInject';
        var self = this;
        self.controllerName = 'manageDistributionListDirectiveCtrl';

        self.isSimpleCorrespondenceSiteSearchType = rootEntity.getGlobalSettings().simpleCorsSiteSearch;
        self.correspondenceSiteTypes = correspondenceSiteTypeService.correspondenceSiteTypes;

        // model to search on correspondence sites type
        self.siteTypeSearchText = '';
        self.selectedSiteType = null;
        // model for search on main correspondence sites
        self.mainSiteSearchText = '';
        // selected mainCorrespondence sites
        self.selectedMainSite = null;
        // model for search on sub correspondence sites
        self.subSiteSearchText = '';
        // sub Search result
        self.subSearchResult = [];
        // sub correspondence selected from result
        self.subSearchSelected = [];
        // distribution list members
        self.distributionListMembers = [];
        // selected distribution list members
        self.distributionListMembersSelected = [];

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
            distributionListMembersGrid: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'mainArSiteText', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.distributionListMembers.length + 21);
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
                .setCorrespondenceSiteType(_getTypeByLookupKey(siteView.correspondenceSiteTypeId));
        }

        /**
         * @description filter searched subSites.
         * @return {boolean}
         * @private
         */
        function filterSearchedSubSites() {
            self.subSearchResult = _.filter(self.subSearchResultCopy, function (searchedSite) {
                var existingIds = _.map(self.distributionListMembers, function (member) {
                    return member.site.id;
                });
                return existingIds.indexOf(searchedSite.id) === -1;
            });
        }

        /**
         * @description Get main correspondence sites on change of correspondence site type.
         * @param $event
         */
        self.onSiteTypeSimpleChange = function ($event) {
            self.selectedMainSite = null;
            self.mainSites = [];
            self.mainSitesCopy = angular.copy(self.mainSites);
            self.subSearchResult = [];
            self.subSearchResultCopy = angular.copy(self.subSearchResult);

            if (self.selectedSiteType) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                    criteria: null,
                    excludeOuSites: true
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    _selectDefaultMainSiteAndGetSubSites();
                });
            }
        };

        /**
         * @description Get main correspondence sites on change of correspondence site type in advanced search.
         * @param $event
         */
        self.onSiteTypeChangeAdvanced = function ($event) {
            self.selectedMainSite = null;
            self.mainSites = [];
            self.mainSitesCopy = angular.copy(self.mainSites);
            self.subSearchResult = [];
            self.subSearchResultCopy = angular.copy(self.subSearchResult);

            var siteType = self.selectedSiteType && self.selectedSiteType.hasOwnProperty('lookupKey')
                ? self.selectedSiteType.lookupKey
                : self.selectedSiteType;
            if (siteType) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: siteType,
                    criteria: null,
                    excludeOuSites: true
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    _selectDefaultMainSiteAndGetSubSitesAdvanced();
                });
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.onMainSiteChangeSimple = function ($event) {
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                criteria: null,
                excludeOuSites: true,
                maxRows: 300
            }).then(function (result) {
                self.subSearchResultCopy = angular.copy(result);
                filterSearchedSubSites();
            });
        };

        /**
         * @description set selected type when not selected after select main site.
         */
        self.onMainSiteChangeAdvanced = function () {
            if (!!self.selectedMainSite) {
                if (!self.selectedSiteType) {
                    self.selectedSiteType = _mapTypes(_getTypeByLookupKey(self.selectedMainSite.correspondenceSiteTypeId));
                }
                self.subSiteSearchText = '';
                self.onSubSiteSearch(true);
            }
        };

        /**
         * search in sub correspondence sites related to mainSites.
         * @return {*}
         */
        self.onSubSiteSearch = function (skipSubSiteText) {
            if (!skipSubSiteText) {
                if (!self.subSiteSearchText.length) {
                    refreshDebounce();
                } else if (self.subSiteSearchText.length < 3) {
                    //self.subSearchResult = [];
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
                            type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                            parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                            criteria: self.subSiteSearchText,
                            excludeOuSites: true,
                            maxRows: 300
                        }).then(function (result) {
                            self.subSearchResultCopy = angular.copy(result);
                            filterSearchedSubSites();
                            resolve(self.subSearchResult);
                        });
                    }, 500);
                });
            }
            return pendingSearch;
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
                excludeOuSites: true,
                maxRows: 300
            }).then(function (result) {
                self.subSearchResultCopy = angular.copy(result);
                filterSearchedSubSites();
            });
        };

        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch = function () {
            /*if (!self.isSimpleCorrespondenceSiteSearchType) {
                self.subSearchResult = self.subSearchResultCopy = [];
                self.subSearchSelected = [];
            } else {
                self.getSubSites();
            }
            self.subSiteSearchText = '';*/

            self.subSearchResult = [];
            self.subSearchResultCopy = [];
            self.subSearchSelected = [];
            self.subSiteSearchText = '';
        };

        /**
         * @description add single site to distribution list members
         * @param site
         * @param $event
         */
        self.addDistributionListMember = function (site, $event) {
            self.distributionListMembers.push({site: site});
            self.subSearchSelected = [];
            filterSearchedSubSites();
        };

        function _filterSubSites(site) {
            return !(_.find(self.distributionListMembers, function (item) {
                return item.site.subSiteId === site.id;
            }));
            //return self.distributionListMembers.indexOf(site.subSiteId) === -1;
        }

        /**
         * @description add bulk sites to distribution list members
         * @param $event
         */
        self.addDistributionListMemberBulk = function ($event) {
            for (var i = 0; i < self.subSearchSelected.length; i++) {
                self.distributionListMembers.push({site: self.subSearchSelected[i]});
            }
            self.subSearchSelected = [];
            filterSearchedSubSites();
        };

        /**
         * @description Delete distribution list member
         * @param memberToDelete
         * @param $event
         */
        self.deleteDistributionListMember = function (memberToDelete, $event) {
            dialog.confirmMessage(langService.get('confirm_remove').change({name: memberToDelete.site.getTranslatedName()}))
                .then(function (result) {
                    self.distributionListMembers = _.filter(self.distributionListMembers, function (member) {
                        return memberToDelete.site.id !== member.site.id;
                    });
                    self.distributionListMembersSelected = [];
                    filterSearchedSubSites();
                })
        };

        /**
         * @description Delete distribution list member bulk
         * @param $event
         */
        self.deleteDistributionListMemberBulk = function ($event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                .then(function (result) {
                    var membersIds = _.map(self.distributionListMembersSelected, function (member) {
                        return member.site.id;
                    });
                    self.distributionListMembers = _.filter(self.distributionListMembers, function (member) {
                        return membersIds.indexOf(member.site.id) === -1;
                    });
                    self.distributionListMembersSelected = [];
                    filterSearchedSubSites();
                })
        };


        var _selectDefaultMainSiteAndGetSubSites = function () {
            if (self.selectedSiteType && self.selectedSiteType.lookupKey === 1) {
                self.selectedMainSite = _.find(self.mainSites, function (site) {
                    return site.id === 10000000;
                });
                self.selectedMainSite ? self.onMainSiteChangeSimple() : null;
            }
        };

        var _selectDefaultMainSiteAndGetSubSitesAdvanced = function () {
            if (self.selectedSiteType && self.selectedSiteType.lookupKey === 1) {
                self.selectedMainSite = _.find(self.mainSites, function (site) {
                    return site.id === 10000000;
                });
                self.selectedMainSite ? self.onMainSiteChangeAdvanced() : null;
            }
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
            $timeout(function () {
                if (fieldType === 'mainSite') {
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
                    if (fieldType === 'mainSite') {
                        self.loadMainSitesRecords($event);
                    } else if (fieldType === 'subSite') {
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
         * @description request service for loading dropdown records with searchText
         * @param $event
         */
        self.loadMainSitesRecords = function ($event) {
            var searchText = self.mainSiteSearchText,
                siteType = self.selectedSiteType,
                excludeOUSites = true;

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
                type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                criteria: self.subSiteSearchText,
                excludeOuSites: true
            }).then(function (result) {
                if (result.length) {
                    var availableSubSitesIds = _.map(self.subSearchResultCopy, 'id');
                    result = _.filter(result, function (corrSite) {
                        return availableSubSitesIds.indexOf(corrSite.id) === -1;
                    });
                    result = _.filter(result, _filterSubSites);
                    self.subSearchResult = self.subSearchResult.concat(result);
                    self.subSearchResultCopy = angular.copy(self.subSearchResult);

                    filterSearchedSubSites();

                } else {
                    self.subSearchResult = angular.copy(self.subSearchResultCopy);
                }
                return self.subSearchResult;
            }).catch(function (error) {
                return self.subSearchResult = angular.copy(self.subSearchResultCopy);
            });
        };

        self.onChangeSubSiteText = function () {
            if(!self.subSiteSearchText){
                self.onSubSiteSearch(false);
            }
        }
    });
};
