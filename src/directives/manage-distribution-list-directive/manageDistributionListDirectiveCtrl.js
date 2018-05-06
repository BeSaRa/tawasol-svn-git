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
                                                                    CorrespondenceSiteView,
                                                                    correspondenceSiteTypeService,
                                                                    rootEntity) {

        'ngInject';
        var self = this;
        self.controllerName = 'manageDistributionListDirectiveCtrl';

        self.isSimpleCorrespondenceSiteSearchType = rootEntity.getGlobalSettings().simpleCorsSiteSearch;

        self.correspondenceSiteTypes = correspondenceSiteTypeService.correspondenceSiteTypes;
        // model to search on correspondence sites type
        self.typeSearch = '';
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
                    excludeOuSites: true
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
        self.getSubSites = function ($event) {
            correspondenceViewService.correspondenceSiteSearchForDistributionList('sub', {
                type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                criteria: null,
                excludeOuSites: true
            }).then(function (result) {
                self.subSearchResultCopy = angular.copy(result);
                filterSearchedSubSites();
            });
        };

        /**
         * search in MainCorrespondenceSites and retrieve the filtered result.
         * @return {Array}
         * @param mainSiteSearchText
         */
        self.onMainSiteSearch = function (mainSiteSearchText) {
            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();
                if (self.mainSiteSearchText.trim().length < 2)
                    return [];

                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;

                    $timeout(function () {
                        refreshDebounce();
                        correspondenceViewService.correspondenceSiteSearch('main', {
                            type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                            criteria: mainSiteSearchText,
                            excludeOuSites: true
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
        self.onMainSiteChange = function (main) {
            if (main && !self.selectedSiteType)
                self.selectedSiteType = _mapTypes(_getTypeByLookupKey(main.correspondenceSiteTypeId));
        };

        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch = function () {
            self.subSearchResult = self.subSearchResultCopy = [];
            self.subSearchSelected = [];
            self.subSiteSearchText = '';
        };

        /**
         * search in sub correspondence sites related to mainSites.
         * @return {*}
         */
        self.onSubSearch = function () {
            if (self.subSiteSearchText.length < 3) {
                self.subSearchResult = [];
                return;
            }

            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();

                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;

                    $timeout(function () {
                        refreshDebounce();
                        correspondenceViewService.correspondenceSiteSearchForDistributionList('sub', {
                            type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                            parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                            criteria: self.subSiteSearchText,
                            excludeOuSites: true
                        }).then(function (result) {
                            if (self.subSiteSearchText.length < 3) {
                                self.subSearchResult = [];
                                return;
                            }
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
         * @description add single site to distribution list members
         * @param site
         * @param $event
         */
        self.addDistributionListMember = function (site, $event) {
            self.distributionListMembers.push({site: site});
            self.subSearchSelected = [];
            filterSearchedSubSites();
        };

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
    });
};