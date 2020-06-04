module.exports = function (app) {
    app.controller('followUpPopCtrl', function (followUpData,
                                                followUpUserService,
                                                folders,
                                                toast,
                                                _,
                                                langService,
                                                dialog,
                                                addToMyFollowup,
                                                followUpOrganizations,
                                                organizationForSLA,
                                                moment,
                                                generator,
                                                Information,
                                                distributionWFService) {
        'ngInject';
        var self = this;
        self.controllerName = 'followUpPopCtrl';
        self.model = followUpData;
        self.folders = folders || [];

        self.addToMyFollowup = addToMyFollowup;
        // if followup for other user, don't use folders
        if (!addToMyFollowup) {
            self.folders = [];
        }

        self.selectedOrganization = null;
        self.selectedApplicationUser = null;
        self.ouSearchText = '';
        self.appUserSearchText = '';
        self.inProgress = false;

        self.minDate = new Date();
        //self.minDate.setDate(self.minDate.getDate() + 1);
        self.minDateString = moment(self.minDate).format(generator.defaultDateFormat);

        // if no followupDate, set followupDate from organization SLA
        if (!self.model.followupDate) {
            self.model.followupDate = generator.getNextDaysDate(organizationForSLA.sla[followUpData.priorityLevel]);
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

            // sort regOu-section
            return _.sortBy([].concat(regOus, sections), [function (ou) {
                return ou.tempRegOUSection[langService.current + 'Name'].toLowerCase();
            }]);
        };
        self.organizations = _mapRegOUSections(); // used for followup for other user
        self.applicationUsers = [];

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.getAppUsersForOU = function ($event) {
            self.selectedApplicationUser = null;
            self.folders = [];
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

        /**
         * @description Gets the folder for selected application user
         */
        self.getUserFollowupFolders = function () {
            self.folders = [];

            if (!self.selectedOrganization || !self.selectedApplicationUser) {
                return;
            }
            self.inProgress = true;
            followUpUserService.loadFollowupFoldersByOuAndUser(self.selectedOrganization, self.selectedApplicationUser, false)
                .then(function (folders) {
                    self.folders = folders;
                    self.inProgress = false;
                })
        };

        /**
         * @description Reset the filter and search for user followup books again
         */
        self.onChangeUser = function () {
            self.model.folderId = null;
            self.getUserFollowupFolders();
        };


        self.saveToFollowUp = function () {
            var modelToSave = angular.copy(self.model);
            if (!addToMyFollowup) {
                modelToSave.userId = self.selectedApplicationUser;
                modelToSave.userOUID = self.selectedOrganization;
            }

            return followUpUserService
                .saveUserFollowUp(modelToSave)
                .then(function () {
                    toast.success(langService.get('followup_added_successfully').change({name: modelToSave.docSubject}));
                    dialog.hide();
                });
        };

        /**
         * @description Checks if followup is valid
         * @returns {boolean|*|null}
         */
        self.isValidFollowup = function (form) {
            var isValid = form.$valid && !self.inProgress && self.model.folderId && (self.model.followupDate && self.model.followupDate >= self.minDate);
            if (addToMyFollowup) {
                return isValid;
            }
            return isValid && self.selectedOrganization && self.selectedApplicationUser;
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

        self.closeDialog = function () {
            dialog.cancel();
        };


    });
};
