module.exports = function (app) {
    app.controller('manageCorrespondenceSiteIncomingSimpleDirectiveCtrl', function (correspondenceViewService,
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
                                                                                    toast,
                                                                                    generator,
                                                                                    rootEntity,
                                                                                    managerService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSiteIncomingSimpleDirectiveCtrl';
        // watch the language for any changes from current user.
        LangWatcher($scope);

        self.mainSiteSearchText = '';
        self.subSiteSearchText = '';

        self.documentClass = 'incoming';
        // followup statuses
        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);

        self.querySearchDefer = false;

        self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
        self.correspondenceSiteTypesCopy = angular.copy(self.correspondenceSiteTypes);

        self.mainSites = [];
        self.mainSitesCopy = angular.copy(self.mainSite);

        self.subSites = [];
        self.subSitesCopy = angular.copy(self.subSites);

        self.selectedSiteType = null;
        self.selectedMainSite = null;
        self.selectedSubSite = null;

        self.previousSubSites = [];
        self.previousMainSites = [];

        // book vsId
        self.vsId = null;

        // all sub correspondence sites
        self.subRecords = _concatCorrespondenceSites(true);
        // to check if simple search
        self.simpleSearch = rootEntity.getGlobalSettings().simpleCorsSiteSearch;

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
         * @description map sub Sites.
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
         * @description filter subSites.
         * @param site
         * @return {boolean}
         * @private
         */
        function _filterSubSites(site) {
            return self.subRecords.indexOf(site.subSiteId) === -1;
        }

        /**
         * @description Get main correspondence sites on change of correspondence site type.
         * @param $event
         */
        self.onSiteTypeChange = function ($event) {
            self.selectedMainSite = null;
            self.selectedSubSite = null;

            if (self.selectedSiteType) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    self.subSites = [];
                    self.subSitesCopy = [];
                    _selectDefaultMainSiteAndGetSubSites();
                });
            } else {
                self.mainSites = [];
                self.mainSitesCopy = angular.copy(self.mainSites);
                self.subSites = [];
                self.subSitesCopy = angular.copy(self.subSites);
                self.subSiteSearchText = '';
            }
        };


        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.getSubSites = function ($event) {
            if (!self.selectedMainSite) {
                self.subSites = [];
                self.subSitesCopy = [];
                self.selectedSubSite = null;
                self.subSiteSearchText = '';
                return;
            }
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                criteria: null,
                excludeOuSites: false
            }).then(function (result) {
                self.subSitesCopy = angular.copy(_.map(result, _mapSubSites));
                self.subSites = _.filter(_.map(result, _mapSubSites), _filterSubSites);
                self.selectedSubSite = null;
                if (self.subSites.length === 1) {
                    self.selectedSubSite = self.subSites[0];
                    self.changeSubCorrespondence(self.selectedSubSite);
                }
            });
        };

        /**
         * @description filter sub sites
         * @param searchText
         * @returns {any}
         */
        self.querySearchSubSites = function (searchText) {
            searchText = searchText ? searchText.toLowerCase() : null;
            var langName = generator.ucFirst(langService.current),
                result = searchText ? self.subSites.filter(function (item) {
                    return item['sub' + langName + 'SiteText'].toLowerCase().indexOf(searchText) !== -1;
                }) : self.subSites;

            if (!self.querySearchDefer) {
                return result;
            } else {
                var defer = $q.defer();
                $timeout(function () {
                    defer.resolve(result);
                }, Math.random() * 1000, false);
                return defer.promise;
            }
        };

        /**
         * replace correspondence Site
         * @param site
         */
        self.replaceSite = function (site) {
            if (self.needReply(site.followupStatus) && !(site.followupDate))
                return toast.error(langService.get('sites_please_select_followup_date'));
            self.site = site;
        };

        self.changeSubCorrespondence = function (item) {
            if (item) {
                self.replaceSite(item);
            } else {
                self.site = null;
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
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
            $timeout(function () {
                if (fieldType === 'mainSite') {
                    self.mainSites = angular.copy(self.mainSitesCopy);
                } else if (fieldType === 'subSite') {

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
            var siteType = self.selectedSiteType ? (self.selectedSiteType.hasOwnProperty('lookupKey') ? self.selectedSiteType.lookupKey : self.selectedSiteType) : null;
            if (self.mainSiteSearchText) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: siteType,
                    criteria: self.mainSiteSearchText,
                    excludeOuSites: false
                }).then(function (result) {
                    if (result.length) {
                        self.subSites = [];
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
                type: self.selectedSiteType ? self.selectedSiteType.lookupKey : null,
                parent: self.selectedMainSite ? self.selectedMainSite.id : null,
                criteria: self.subSiteSearchText,
                excludeOuSites: false
            }).then(function (result) {
                if (result.length) {
                    var availableSubSitesIds = _.map(self.subSitesCopy, 'subSiteId');
                    result = _.filter(result, function (corrSite) {
                        return availableSubSitesIds.indexOf(corrSite.id) === -1;
                    });

                    result = _.filter(_.map(result, _mapSubSites), _filterSubSites);

                    self.subSites = self.subSites.concat(result);
                    self.subSitesCopy = angular.copy(self.subSites);
                } else {
                    self.subSites = angular.copy(self.subSitesCopy);
                }
                return self.subSites;
            }).catch(function (error) {
                return self.subSites = angular.copy(self.subSitesCopy);
            });
        };

        var _selectDefaultMainSiteAndGetSubSites = function () {
            if (self.selectedSiteType && self.selectedSiteType.lookupKey === 1) {
                self.selectedMainSite = _.find(self.mainSites, function (site) {
                    return site.id === 10000000;
                });
                self.selectedMainSite ? self.getSubSites() : null;
            }
        };

        /**
         * @description Check if sub site search has text and is enabled
         * @returns {string|boolean}
         */
        self.isSubSiteSearchEnabled = function () {
            return self.subSiteSearchText && (!(!self.selectedMainSite || self.selectedSubSite));
        };


        /**
         * @description fir the callback if the provider  text length equal = 0
         * @param $event
         * @param text
         * @param callback
         */
        self.setPropertiesSpaceBackIfNoLength = function ($event, text, callback) {
            var key = $event.keyCode || $event.which;
            if (!text.length && key === 8) {
                callback();
            }
        };

        /**
         * capture any event except arrows UP/DOWN allow those.
         * @param $event
         * @param enterCallback
         */
        self.allowPropagationUpDownArrows = function ($event, enterCallback) {
            var key = $event.keyCode || $event.which;
            if (key === 13 && enterCallback) {
                enterCallback($event);
                $event.stopPropagation();
            }
            var allowedKeys = [38 /* UP */, 40 /* DOWN */];
            allowedKeys.indexOf(key) === -1 ? $event.stopPropagation() : null;
        };

        /**
         * @description set previous main sites to the active list
         */
        self.setOldMainSites = function () {
            self.previousMainSites.length && !self.mainSites.length ? self.mainSites = self.previousMainSites : null;
            self.previousMainSites = [];
        };
        /**
         * @description set previous sub sites to the active list
         */
        self.setOldSubSites = function () {
            self.previousSubSites.length && !self.subSites.length ? self.subSites = self.previousSubSites : null;
            self.previousSubSites = [];
        };

        self.loadMainSitesByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }
            // to reserve old main sites
            if (self.mainSites.length)
                self.previousMainSites = angular.copy(self.mainSites);

            self.loadSitesByCriteria('main', self.mainSiteSearchText)
                .then(function (sites) {
                    self.mainSites = sites;
                })
        };
        /**
         * @description load sub sites depend on criteria ... used to load more if the current su sites dose not have what the user searched for.
         * @param $event
         */
        self.loadSubSitesByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }
            // to reserve old sub sites
            if (self.subSites.length)
                self.previousSubSites = angular.copy(self.subSites);

            self.loadSitesByCriteria('sub', self.subSiteSearchText)
                .then(function (sites) {
                    self.subSites = _.map(sites, _mapSubSites);
                });
        };
        /**
         * @description load sites by criteria
         * @param type
         * @param criteria
         * @returns {*}
         */
        self.loadSitesByCriteria = function (type, criteria) {
            return correspondenceViewService
                .correspondenceSiteSearch(type, {
                    type: null,
                    criteria: criteria ? criteria : null,
                    parent: type === 'main' ? null : (self.selectedMainSite ? self.selectedMainSite.id : null),
                    excludeOuSites: false,
                    includeDisabled: false
                });
        };

        self.subSiteChanged = function () {
            self.changeSubCorrespondence(self.selectedSubSite);
        };


        $scope.$watch(function () {
            return self.emptySubRecords;
        }, function (value) {
            if (value) {
                self.subRecords = _concatCorrespondenceSites(true);

                self.selectedSiteType = null;
                self.selectedMainSite = null;
                self.selectedSubSite = null;
                self.subSiteSearchText = '';

                self.subSites = [];
                self.subSitesCopy = [];
                self.emptySubRecords = false;
            }
        });

    });
};
