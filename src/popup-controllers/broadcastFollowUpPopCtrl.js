module.exports = function (app) {
    app.controller('broadcastFollowUpPopCtrl', function (followUpData,
                                                         followUpUserService,
                                                         toast,
                                                         _,
                                                         gridService,
                                                         langService,
                                                         dialog,
                                                         $filter,
                                                         $timeout,
                                                         followUpOrganizations,
                                                         organizationForSLA,
                                                         moment,
                                                         generator,
                                                         Information,
                                                         distributionWFService) {
        'ngInject';
        var self = this;
        self.controllerName = 'broadcastFollowUpPopCtrl';
        self.model = followUpData;

        self.selectedOrganization = null;
        self.selectedApplicationUser = null;
        self.usersToFollowup = [];
        self.usersToFollowupCopy = angular.copy(self.usersToFollowup);

        self.selectedRecords = [];

        self.ouSearchText = '';
        self.appUserSearchText = '';
        self.inProgress = false;

        self.minDate = new Date();
        //self.minDate.setDate(self.minDate.getDate() + 1);
        self.minDate.setHours(0, 0, 0, 0);
        self.minDateString = moment(self.minDate).format(generator.defaultDateFormat);

        // if no followupDate, set followupDate from organization SLA
        if (!self.model.followupDate) {
            self.model.followupDate = generator.getFutureDate(organizationForSLA.sla[followUpData.priorityLevel]);
        }

        var _mapRegOUSections = function () {
            // filter all regOU (has registry)
            var regOus = _.filter(followUpOrganizations, function (item) {
                    return item.hasRegistry;
                }),
                // filter all sections (no registry)
                sections = _.filter(followUpOrganizations, function (ou) {
                    return !ou.hasRegistry;
                }),
                // registry parent organization
                parentRegistryOu;

            // To show (regou - section), append the dummy property "tempRegOUSection"
            regOus = _.map(regOus, function (regOu) {
                regOu.tempRegOUSection = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });
            sections = _.map(sections, function (section) {
                parentRegistryOu = (section.regouId || section.regOuId);
                if (typeof parentRegistryOu === 'number') {
                    parentRegistryOu = _.find(followUpOrganizations, function (ou) {
                        return ou.id === parentRegistryOu;
                    })
                }

                section.tempRegOUSection = new Information({
                    arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + section.arName,
                    enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + section.enName
                });
                return section;
            });

            // sorting from BE based on user selection (alphabetical or by org structure)
            return [].concat(regOus, sections);
        };
        self.organizations = _mapRegOUSections(); // used for followup for other user
        self.applicationUsers = [];

        self.grid = {
            name: 'broadcastFollowupGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.usersToFollowup.length + 21)
                    }
                }
            ],
            searchColumns: {
                user: function (record) {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                },
                ou: ''
            },
            searchText: '',
            searchCallback: function (grid) {
                self.usersToFollowup = gridService.searchGridData(self.grid, self.usersToFollowupCopy);
            }
        };

        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.usersToFollowup = $filter('orderBy')(self.usersToFollowup, self.grid.order);
        };

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.getAppUsersForOU = function ($event) {
            self.selectedApplicationUser = null;
            self.inProgress = true;

            if (!self.selectedOrganization) {
                self.applicationUsers = [];
                return;
            }
            return distributionWFService
                .searchUsersByCriteria({ou: self.selectedOrganization})
                .then(function (result) {
                    self.applicationUsers = result;
                    self.inProgress = false;
                    return result;
                });
        };

        self.addToRecords = function () {
            self.usersToFollowup.push(self.selectedApplicationUser);
            self.usersToFollowupCopy = angular.copy(self.usersToFollowup);

            self.selectedApplicationUser = null;
        };

        self.removeRecord = function ($event, user) {
            self.usersToFollowup = _.filter(self.usersToFollowup, function (item) {
                return !(item.id === user.id && item.ouId === user.ouId);
            });
            self.usersToFollowupCopy = angular.copy(self.usersToFollowup);
        };

        self.isExistingRecord = function (user) {
            return _.some(self.usersToFollowup, function (item) {
                return item.id === user.id && item.ouId === user.ouId;
            });
        };

        self.saveToFollowUp = function () {
            var modelToSave = angular.copy(self.model);
            modelToSave.userList = self.usersToFollowup;

            return followUpUserService
                .saveBroadcastFollowup(modelToSave)
                .then(function () {
                    toast.success(langService.get('followup_added_successfully').change({name: modelToSave.docSubject}));
                    dialog.hide();
                });
        };

        /**
         * @description Checks if followup is valid
         * @returns {boolean|*|null}
         */
        self.isValidFollowup = function () {
            var isValid = !self.inProgress && (!!self.model.followupDate && generator.getTimeStampFromDate(self.model.followupDate) >= generator.getTimeStampFromDate(self.minDate));
            return isValid && self.usersToFollowup.length > 0;
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
