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
                                                                    correspondenceService) {

        'ngInject';
        var self = this;
        self.controllerName = 'manageDistributionListDirectiveCtrl';
        /*$timeout(function () {
            var defer = $q.defer();
            correspondenceSiteTypeService.getCorrespondenceSiteTypes()
                .then(function (result) {
                    self.correspondenceSiteTypes = result;
                    defer.resolve(result);
                });
            defer.promise.then(function () {
                self.correspondenceSiteTypes.push(new CorrespondenceSiteType({
                    id: null,
                    arName: langService.getKey('not_found', 'ar'),
                    enName: langService.getKey('not_found', 'en')
                }));
            });
        });*/
        self.correspondenceSiteTypes = correspondenceSiteTypeService.correspondenceSiteTypes;
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
         * when selected type changed.
         * @param type
         */
        self.onTypeChange = function (type) {

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
                            criteria: mainSearch,
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
        self.onMainChange = function (main) {
            if (main && !self.selectedType)
                self.selectedType = _mapTypes(_getTypeByLookupKey(main.correspondenceSiteTypeId));
        };

        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch = function () {
            self.subSearchResult = self.subSearchResultCopy = [];
            self.subSearchSelected = [];
            self.subSearch = '';
        };

        /*/!**
         * @description delete bulk sites
         * @param type
         * @param $event
         *!/
        self.onSitesInfoDeleteBulk = function (type, $event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    // TODO: need to refactor .
                    var ids = _.map(self['sitesInfo' + type + 'Selected'], 'subSiteId');
                    self['sitesInfo' + type] = _.filter(self['sitesInfo' + type], function (site) {
                        return ids.indexOf(site.subSiteId) === -1;
                    });
                    self['sitesInfo' + type + 'Selected'] = [];
                    _concatCorrespondenceSites(false);
                });
        };*/
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
                        correspondenceViewService.correspondenceSiteSearchForDistributionList('sub', {
                            type: self.selectedType ? self.selectedType.lookupKey : null,
                            parent: self.selectedMain ? self.selectedMain.id : null,
                            criteria: self.subSearch,
                            excludeOuSites: true
                        }).then(function (result) {
                            if (self.subSearch.length < 3) {
                                self.subSearchResult = [];
                                return;
                            }
                            self.subSearchResultCopy = angular.copy(result);
                            filterSearchedSubSites();
                            //self.subSearchResult = generator.interceptReceivedCollection('CorrespondenceSiteView', self.subSearchResult);
                            //self.subSearchResult = self.subSearchResultCopy = generator.generateCollection(result, CorrespondenceSiteView);

                            //self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSearchedSubSites);
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