module.exports = function (app) {
    app.controller('userSentItemFilterPopCtrl', function (dialog,
                                                          lookupService,
                                                          _,
                                                          userSentItemService,
                                                          correspondenceViewService,
                                                          Site,
                                                          grid,
                                                          $timeout,
                                                          searchCriteria,
                                                          workflowActions,
                                                          documentStatuses,
                                                          correspondenceSiteTypes,
                                                          usersTo,
                                                          selectedEmployee,
                                                          selectedOrganization,
                                                          moment) {
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
        // this is the selected employee and organization when open from followup sent items
        self.selectedEmployee = selectedEmployee;
        self.selectedOrganization = selectedOrganization;

        self.siteTypeSearchText = '';
        self.mainSiteSearchText = '';
        self.subSiteSearchText = '';
        self.receiverSearchText = '';
        // self.fromActionTimeMinValue = moment().subtract(1, 'years').toDate();
        self.toActionTimeMaxValue = moment().endOf("day").toDate();

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
         * @description Handles the change of from action date field
         */
        self.onChangeFromActionTime = function () {
            if (!self.searchCriteria.fromActionTime) {
                self.searchCriteria.toActionTime = null;
            } else {
                var fromYear = new Date(self.searchCriteria.fromActionTime).getFullYear();
                var toYear = new Date(self.searchCriteria.toActionTime).getFullYear();
                if (fromYear !== toYear) {
                    self.searchCriteria.toActionTime = null;
                }
            }
        };

        /**
         * @description Filters the user sent items based on criteria selected by user
         * @param $event
         * @returns {*}
         */
        self.filterUserSentItems = function ($event) {
            if (!self.isFilterDisabled()) {
                return userSentItemService.filterUserSentItems(null, self.searchCriteria, null, self.selectedEmployee, self.selectedOrganization)
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
         * @description Reset the filter for user sent items
         * @param $event
         * @returns {*}
         */
        self.resetFilter = function ($event) {
            return userSentItemService.getUserSentItems()
                .then(function (result) {
                    dialog.hide({
                        result: {
                            records: result,
                            count: userSentItemService.totalCount
                        },
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

        self.isFilterDisabled = function () {
            var hasValue = !!self.searchCriteria.docSubject ||
                !!self.searchCriteria.docFullSerial ||
                !!self.searchCriteria.docClassId ||
                !!self.searchCriteria.workflowActionId ||
                !!self.searchCriteria.documentStatusId ||
                !!self.searchCriteria.userToId ||
                !!self.searchCriteria.selectedSiteType ||
                !!(self.searchCriteria.fromActionTime && self.searchCriteria.toActionTime);
            return !hasValue;
        };
    });
};
