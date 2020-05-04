module.exports = function (app) {
    app.controller('followupEmployeeInboxPopCtrl', function (ouApplicationUserService,
                                                             _,
                                                             toast,
                                                             generator,
                                                             dialog,
                                                             langService,
                                                             Organization,
                                                             ApplicationUser,
                                                             selectedOrganization,
                                                             selectedUser,
                                                             isFollowupSentItems,
                                                             followUpOrganizations,
                                                             ouApplicationUsers,
                                                             employeeService,
                                                             rootEntity,
                                                             Information) {
        'ngInject';
        var self = this;
        self.controllerName = 'followupEmployeeInboxPopCtrl';

        self.inlineOUSearchText = '';
        self.inlineAppUserSearchText = '';
        self.isFollowupSentItems = isFollowupSentItems;
        self.securityLevels = rootEntity.getGlobalSettings().securityLevels;

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
        self.organizations = _mapRegOUSections();

        self.ouApplicationUsers = ouApplicationUsers;

        self.selectedOrganizationCopy = angular.copy(selectedOrganization);
        self.selectedApplicationUserCopy = angular.copy(selectedUser);

        self.selectedOrganization = selectedOrganization || null;
        self.selectedApplicationUser = selectedUser || null;

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.getApplicationUsersForOU = function ($event) {
            self.selectedApplicationUser = null;
            return ouApplicationUserService.loadRelatedOUApplicationUsers(self.selectedOrganization)
                .then(function (result) {
                    self.ouApplicationUsers = result;
                    return result;
                });
        };


        /**
         * @description Close the popup and get inbox according to selected ou and user
         * @param $event
         * @returns {*|Promise<any>}
         */
        self.getFollowupEmployeeDataForOUAndUser = function ($event) {
            dialog.hide(
                {
                    organization: self.selectedOrganization,
                    applicationUser: self.selectedApplicationUser,
                    availableUsers: self.ouApplicationUsers,
                    securityLevels: self.selectedSecurityLevels ? generator.getResultFromSelectedCollection(self.selectedSecurityLevels, 'lookupKey') : null
                }
            );
        };

        /**
         * @description Close the popup
         */
        self.closeFollowupEmployeeInboxPopupFromCtrl = function () {
            dialog.cancel();
        };

        self.notCurrentUser = function (user) {
            return employeeService.getEmployee().id === user.id;
        }


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

    });
};
