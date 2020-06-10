module.exports = function (app) {
    app.controller('followupBookSearchPopCtrl', function (followUpUserService,
                                                          _,
                                                          toast,
                                                          FollowupBookCriteria,
                                                          validationService,
                                                          generator,
                                                          dialog,
                                                          langService,
                                                          searchCriteria,
                                                          $timeout,
                                                          correspondenceSiteTypes,
                                                          correspondenceViewService,
                                                          moment,
                                                          folders,
                                                          isAdminFollowup) {
        'ngInject';
        var self = this;
        self.controllerName = 'followupBookSearchPopCtrl';
        self.searchCriteria = angular.copy(searchCriteria);
        self.model = angular.copy(searchCriteria);
        self.isAdminFollowup = isAdminFollowup;

        self.siteTypeSearchText = '';
        self.mainSiteSearchText = '';
        self.subSiteSearchText = '';

        self.correspondenceSiteTypes = correspondenceSiteTypes;
        self.folders = folders;
        self.todayEndOfDay = moment().endOf("day").toDate();

        self.terminatedOptions = [
            {
                id: 1,
                langKey: 'all',
                value: null
            },
            {
                id: 2,
                langKey: 'not_terminated',
                value: true
            },
            {
                id: 3,
                langKey: 'terminated',
                value: false
            }
        ];

        $timeout(function () {
            if (self.searchCriteria.selectedSiteType) {
                self.getMainSites(false);
            }
        });

        /**
         * @description Get the main sites on change of site type
         * @param resetMainAndSub
         * @param $event
         */
        self.getMainSites = function (resetMainAndSub, $event) {
            if (self.searchCriteria.selectedSiteType && self.searchCriteria.selectedSiteType.id) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.searchCriteria.selectedSiteType.lookupKey,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(result);
                    self.subSites = [];
                    if (resetMainAndSub) {
                        self.searchCriteria.selectedMainSite = null;
                        self.searchCriteria.selectedSubSite = null;
                    }
                    if (self.searchCriteria.selectedMainSite) {
                        self.getSubSites(false);
                    }
                });
            } else {
                self.mainSites = [];
                self.subSites = [];
                self.searchCriteria.selectedMainSite = null;
                self.searchCriteria.selectedSubSite = null;
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param resetSub
         * @param $event
         */
        self.getSubSites = function (resetSub, $event) {
            if (self.searchCriteria.selectedMainSite && self.searchCriteria.selectedMainSite.id) {
                correspondenceViewService.correspondenceSiteSearch('sub', {
                    type: self.searchCriteria.selectedSiteType.lookupKey,
                    parent: self.searchCriteria.selectedMainSite.id,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSites = result;
                    self.subSitesCopy = angular.copy(result);
                    if (resetSub)
                        self.searchCriteria.selectedSubSite = null;
                });
            } else {
                self.subSites = [];
                self.searchCriteria.selectedSubSite = null;
            }
        };

        /**
         * @description Filters the user sent items based on criteria selected by user
         * @param $event
         * @returns {*}
         */
        self.filterRecords = function ($event) {
            if (!self.isFilterDisabled()) {
                return followUpUserService.loadUserFollowupBooksByCriteria(null, self.searchCriteria)
                    .then(function (result) {
                        dialog.hide({
                            result: result,
                            criteria: self.searchCriteria,
                            error: null
                        });
                    })
                    .catch(function (error) {
                        dialog.cancel({
                            result: [],
                            criteria: self.searchCriteria,
                            error: error
                        });
                    });
            }
        };

        /**
         * @description Reset the filter for followup book
         * @param $event
         * @returns {*}
         */
        self.resetFilter = function ($event) {
            generator.resetFields(self.searchCriteria, self.model);
        };

        /**
         * @description Clear the filter for followup book
         * @param $event
         * @returns {*}
         */
        self.clearFilter = function($event){
            dialog.hide({
                result: [],
                criteria: null,
                error: null
            });
        };

        self.isFilterDisabled = function () {
            var hasValue = !!self.searchCriteria.docSubject ||
                !!self.searchCriteria.docFullSerial ||
                !!self.searchCriteria.selectedSiteType ||
                !!(self.searchCriteria.fromFollowupDate && self.searchCriteria.toFollowupDate) ||
                !!(self.searchCriteria.fromDocDate && self.searchCriteria.toDocDate);
            return !hasValue;
        };

        /**
         * @description Handles the change of from followup date field
         */
        self.onChangeFromFollowupDate = function () {
            if (!self.searchCriteria.fromFollowupDate) {
                self.searchCriteria.toFollowupDate = null;
            } else {
                var fromYear = new Date(self.searchCriteria.fromFollowupDate).getFullYear();
                var toYear = new Date(self.searchCriteria.toFollowupDate).getFullYear();
                if (fromYear !== toYear) {
                    self.searchCriteria.toFollowupDate = null;
                }
            }
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
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
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
