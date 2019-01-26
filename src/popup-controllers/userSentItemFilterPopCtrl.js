module.exports = function (app) {
    app.controller('userSentItemFilterPopCtrl', function (dialog,
                                                          lookupService,
                                                          _,
                                                          userSentItemService,
                                                          correspondenceViewService,
                                                          Site,
                                                          $timeout,
                                                          searchCriteria,
                                                          workflowActions,
                                                          documentStatuses,
                                                          correspondenceSiteTypes,
                                                          usersTo) {
        'ngInject';
        var self = this;
        self.controllerName = 'userSentItemFilterPopCtrl';
        self.searchCriteria = angular.copy(searchCriteria);
        self.searchCriteriaCopy = angular.copy(searchCriteria);

        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        self.workflowActions = workflowActions;
        self.documentStatuses = documentStatuses;
        self.correspondenceSiteTypes = correspondenceSiteTypes;
        self.usersTo = usersTo;
        debugger;

        self.siteTypeSearchText = '';
        self.mainSiteSearchText = '';
        self.subSiteSearchText = '';

        $timeout(function () {
            if (self.searchCriteria.selectedSiteType) {
                self.getMainSites();
            }
        });

        /**
         * @description Get the main sites on change of site type
         * @param $event
         */
        self.getMainSites = function ($event) {
            if (self.searchCriteria.selectedSiteType && self.searchCriteria.selectedSiteType.id) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.searchCriteria.selectedSiteType.lookupKey,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(result);
                    self.subSites = [];
                    self.searchCriteria.sitesInfoTo = null;
                    self.searchCriteria.sitesInfoCC = null;
                });
            }
            else {
                self.mainSites = [];
                self.subSites = [];
                self.searchCriteria.sitesInfoTo = null;
                self.searchCriteria.sitesInfoCC = null;
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.getSubSites = function ($event) {
            if (self.searchCriteria.sitesInfoTo && self.searchCriteria.sitesInfoTo.id) {
                correspondenceViewService.correspondenceSiteSearch('sub', {
                    type: self.searchCriteria.selectedSiteType.lookupKey,
                    parent: self.searchCriteria.sitesInfoTo.id,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSites = result;
                    self.subSitesCopy = angular.copy(result);
                    self.searchCriteria.sitesInfoCC = null;
                });
            }
            else {
                self.subSites = [];
                self.searchCriteria.sitesInfoCC = null;
            }
        };

        /**
         * @description Filters the user sent items based on criteria selected by user
         * @param $event
         * @returns {*}
         */
        self.filterUserSentItems = function ($event) {
            return userSentItemService.filterUserSentItems(null, self.searchCriteria)
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
        };

        /**
         * @description Reset the filter for user sent items
         * @param $event
         * @returns {*}
         */
        self.resetFilter = function ($event) {
            return userSentItemService.getUserSentItems()
                .then(function (result) {
                    dialog.hide({
                        result: result,
                        criteria: null,
                        error: null
                    });
                });
        };

        self.closePopUp = function ($event) {
            dialog.cancel();
        };


        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            var code = $event.which || $event.keyCode;
            if (code !== 38 && code !== 40)
                $event.stopPropagation();
        };

    });
};