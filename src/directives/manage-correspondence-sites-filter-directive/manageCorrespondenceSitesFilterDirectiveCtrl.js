module.exports = function (app) {
    app.controller('manageCorrespondenceSitesFilterDirectiveCtrl', function (correspondenceViewService,
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
                                                                             generator,
                                                                             Lookup,
                                                                             gridService,
                                                                             correspondenceService,
                                                                             correspondenceSiteTypeService,
                                                                             Site) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSitesFilterDirectiveCtrl';
        // watch the language for any changes from current user.
        LangWatcher($scope);

        self.selectedSiteType = null;
        self.siteTypeSearchText = '';
        self.mainSiteSearchText = '';

        self.subSitesSelected = [];
        self.subSiteSearchText = '';
        self.selectedMainSite = null;

        self.mainSubSitesSelected = [];
        self.searchModel = '';
        self.mainSubSearchModel = '';

        self.subSitesResultIds = [];
        self.mainSitesResultId = [];

        // selected subCorrespondence sites from search box
        self.selectedSubSite = null;

        correspondenceSiteTypeService.getCorrespondenceSiteTypes().then((correspondenceSiteTypes) => {
            self.correspondenceSiteTypes = correspondenceSiteTypes;
        });
        $timeout(function () {
            self.mainSites = [];
            self.mainSitesCopy = angular.copy(self.mainSites);
            self.subSites = [];
            self.subSitesCopy = angular.copy(self.subSites);

            if (self.mainSubSites && self.mainSubSites.length) {
                self.mainSubSites = self.mainSubSites.map(site => {
                    site.setCorrespondenceSiteType(_getTypeByLookupKey(site.siteType))
                    return site;
                });
            } else {
                self.mainSubSites = [];
            }
        });


        /**
         * @description request service for loading dropdown records with searchText
         * @param resetMainAndSub
         * @param $event
         */
        self.loadMainSitesRecords = function (resetMainAndSub, $event) {
            self.emptyMainSubSites = false;
            if (self.selectedSiteType) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteType.hasOwnProperty('lookupKey') ? self.selectedSiteType.lookupKey : self.selectedSiteType,
                    criteria: self.mainSiteSearchText,
                    excludeOuSites: false
                }).then(function (result) {
                    if (result.length) {
                        self.mainSites = result;
                        self.mainSitesCopy = angular.copy(self.mainSites);

                        self.subSites = [];
                        self.subSitesCopy = [];
                        self.subSiteSearchText = '';
                        self.selectedSubSite = null;
                    } else {
                        self.mainSites = angular.copy(self.mainSitesCopy);
                    }

                    if (resetMainAndSub) {
                        self.selectedMainSite = null;
                    }
                    if (self.selectedMainSite) {
                        self.loadSubSitesRecords();
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
            if (self.selectedMainSite) {
                var mainSite = self.selectedMainSite && self.selectedMainSite.hasOwnProperty('id') ? self.selectedMainSite.id : self.selectedMainSite;
                return correspondenceViewService.correspondenceSiteSearch('sub', {
                    type: self.selectedSiteType.hasOwnProperty('lookupKey') ? self.selectedSiteType.lookupKey : self.selectedSiteType,
                    parent: mainSite,
                    criteria: self.subSiteSearchText,
                    excludeOuSites: false
                }).then(function (result) {
                    if (result.length) {
                        _mapSubSitesResultIds();
                        var availableSubSitesIds = _.map(self.subSitesCopy, 'subSiteId');
                        result = _.filter(result, function (corrSite) {
                            return availableSubSitesIds.indexOf(corrSite.id) === -1;
                        });
                        result = _.filter(_.map(result, _mapSubSites), _filterSubSites);

                        self.subSites = self.subSites.concat(result);
                        self.subSitesCopy = angular.copy(self.subSites);

                        self.subSiteSearchCopy = angular.copy(self.subSites);
                    } else {
                        self.subSites = angular.copy(self.subSitesCopy);
                    }
                    return self.subSites;
                }).catch(function (error) {
                    return self.subSites = angular.copy(self.subSitesCopy);
                });
            } else {
                self.subSites = [];
                self.subSitesCopy = [];
                self.subSiteSearchText = '';
                self.subSitesResultIds = [];
                self.selectedSubSite = null;
                return self.subSites;
            }
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
                            return (self.subSites.length + 21);
                        }
                    }
                ],
                searchColumns: {
                    subSiteText: function (record) {
                        return 'sub' + langService.current.charAt(0).toUpperCase() + langService.current.slice(1) + 'SiteText';
                    }
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.subSites = gridService.searchGridData(self.grid.subSearchResult, self.subSitesCopy);
                    _mapSubSitesResultIds();
                    self.subSites = _.filter(self.subSites, _filterSubSites);
                }
            },
            mainSubSitesResult: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'arName', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.mainSubSites.length + 21);
                        }
                    }
                ]
            }
        }

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
         * @description add main site to selected
         * @param site
         */
        self.addMainToSelected = function (site) {
            var mainSite = _mapMainSite(site);
            // show dialog to remove all sub sites added before
            if (self.isSubSitesIncluded(mainSite)) {
                dialog.confirmMessage((langService.get('confirm_replace_main_with_subs')))
                    .then(function () {
                        self.mainSubSites = self.mainSubSites.filter(item => {
                            return !(item.hasSubSite() && item.mainSiteId === mainSite.mainSiteId);

                        })
                        self.mainSubSites.push(mainSite);
                        self.subSiteSearchText = '';
                        self.subSitesSelected = [];
                        self.mainSubSitesSelected = [];
                        self.selectedSubSite = null;
                    });
            } else {
                self.mainSubSites.push(mainSite);
                self.subSiteSearchText = '';
                self.subSitesSelected = [];
                self.mainSubSitesSelected = [];
                self.selectedSubSite = null;
            }
        }

        self.isSubSitesIncluded = function (site) {
            return _.some(self.mainSubSites, item => {
                return item.hasSubSite() && item.mainSiteId === site.mainSiteId;
            })
        }

        /**
         * add sub site or main site to selected grid
         * @param sites
         */
        self.addSubToSelected = function (sites) {
            self.mainSubSites = self.mainSubSites.concat(Array.isArray(sites) ? sites : [sites]);
            _mapSubSitesResultIds();
            self.subSites = _.filter(self.subSitesCopy, _filterSubSites);
            self.subSiteSearchCopy = angular.copy(self.subSites);
            self.subSiteSearchText = '';
            self.subSitesSelected = [];
            self.selectedSubSite = null;
        }


        /**
         * @description remove selected main or sub site
         * @param site
         * @param $event
         */
        self.removeSelectedSites = function (site, $event) {
            var siteName = site.hasSubSite ? (site.getTranslatedParentName() + ' - ' + site.getTranslatedName()) : site.getTranslatedParentName();
            dialog.confirmMessage(langService.get('confirm_delete').change({name: siteName}), null, null, $event)
                .then(function () {
                    _removeSelectedSites(site);
                    self.subSiteSearchText = '';
                    self.subSitesSelected = [];
                    self.selectedSubSite = null;
                });
        }

        function _removeSelectedSites(site) {
            var index = _.findIndex(self.mainSubSites, function (item) {
                if (!item.hasSubSite()) {
                    return item.mainSiteId === site.mainSiteId;
                }
                return item.subSiteId === site.subSiteId;
            });
            self.mainSubSites.splice(index, 1)
            _mapSubSitesResultIds();
            self.subSites = _.filter(self.subSitesCopy, _filterSubSites);
            self.subSiteSearchCopy = angular.copy(self.subSites);
        }

        /**
         *@description delete bulk
         * @param sites
         * @param $event
         */
        self.removeSelectedSitesBulk = function (sites, $event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    _.forEach(sites, site => {
                        _removeSelectedSites(site);
                    })
                    self.mainSubSitesSelected = [];
                });
        }

        /**
         * filter subSites.
         * @param site
         * @return {boolean}
         * @private
         */
        function _filterSubSites(site) {
            return self.subSitesResultIds.indexOf(site.subSiteId) === -1;
        }

        /**
         * @description check if main site disabled already selected
         * @returns {boolean}
         * @param siteView
         */
        self.mainSiteDisabled = function (siteView) {
            if (!siteView) {
                return true;
            }
            return _.some(self.mainSubSites, (item) => {
                var siteTypeId = item.siteType.hasOwnProperty('id') ? item.siteType.lookupKey : item.siteType;
                //&& self.selectedSiteType === siteTypeId
                return item.mainSiteId === siteView.id && !item.hasSubSite();
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
         * @description map main site
         * @param siteView
         * @returns {Site|*}
         * @private
         */
        function _mapMainSite(siteView) {
            return (new Site())
                .mapMainFromSiteView(siteView)
                .setCorrespondenceSiteType(_getTypeByLookupKey(siteView.correspondenceSiteTypeId));
        }

        function _mapSubSitesResultIds() {
            self.subSitesResultIds = _.map(self.mainSubSites, 'subSiteId');
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
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         * @param fieldType
         */
        self.handleSearchKeyDown = function ($event, fieldType) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                // if enter key pressed, load from server with search text
                if (code === 13) {
                    if (fieldType === 'mainSite') {
                        self.loadMainSitesRecords(false, $event);
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

        self.onSubSiteSelectedChange = function (subSite) {
            if (subSite) {
                self.subSites = _.filter(self.subSitesCopy, function (resultCopy) {
                    return resultCopy.subSiteId === subSite.subSiteId;
                });
            } else
                self.subSites = _.filter(self.subSitesCopy, _filterSubSites);
        };

        /**
         * @description drop down values for sub site result search
         * @param searchText
         * @returns {Array}
         */
        self.getSubSearchOptions = function (searchText) {
            if (searchText) {
                return _.filter(self.subSiteSearchCopy, function (searchSite) {
                    return searchSite.getTranslatedName().toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
                });
            }
            return self.subSiteSearchCopy;
        };

        $scope.$watch(function () {
            return self.emptyMainSubSites;
        }, function (value) {
            if (value) {
                self.selectedSiteType = null;
                self.siteTypeSearchText = '';
                self.mainSiteSearchText = '';
                self.selectedMainSite = null;
                self.mainSubSitesSelected = [];
                self.searchModel = '';
                self.mainSubSearchModel = '';
                self.subSitesSelected = [];
                self.subSites = [];
                self.selectedSubSite = null;
            }

        });


        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };
    });
};
