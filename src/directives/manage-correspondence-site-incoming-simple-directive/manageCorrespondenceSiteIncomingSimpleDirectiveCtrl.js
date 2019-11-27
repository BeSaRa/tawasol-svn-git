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

        self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
        self.correspondenceSiteTypesCopy = angular.copy(self.correspondenceSiteTypes);

        self.mainSites = [];
        self.mainSitesCopy = angular.copy(self.mainSite);

        self.subSites = [];
        self.subSitesCopy = angular.copy(self.subSites);

        self.selectedSiteType = null;
        self.selectedMainSite = null;
        self.selectedSubSite = null;

        // book vsId
        self.vsId = null;

        // all sub correspondence sites
        self.subRecords = _concatCorrespondenceSites(true);

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
            return searchText ? self.subSites.filter(function (item) {
                if (langService.current === 'ar')
                    return item.subArSiteText.toLowerCase().indexOf(searchText) !== -1;
                else
                    return item.subEnSiteText.toLowerCase().indexOf(searchText) !== -1;
            }) : self.subSites;
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
                    self.subSites = _.filter(self.defaultSubSearch, _filterSubSites);
                });
            });
        };

        self.changeSubCorrespondence = function (item) {
            if (item) {
                self.replaceSite(item);
            } else {
                self.site = null;
                _concatCorrespondenceSites(true).then(function () {
                    self.subSites = _.filter(self.subSitesCopy, _filterSubSites);
                });
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
                        self.loadSubSitesRecords($event);
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
            correspondenceViewService.correspondenceSiteSearch('sub', {
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
            }).catch(function (error) {
                self.subSites = angular.copy(self.subSitesCopy);
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
