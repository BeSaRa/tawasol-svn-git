module.exports = function (app) {
    app.controller('followupEmployeeInboxPopCtrl', function (ouApplicationUserService,
                                                             distributionWFService,
                                                             _,
                                                             toast,
                                                             generator,
                                                             dialog,
                                                             langService,
                                                             Organization,
                                                             ApplicationUser,
                                                             selectedOrganization,
                                                             selectedUser,
                                                             selectedSecurityLevels,
                                                             isFollowupSentItems,
                                                             followUpOrganizations,
                                                             applicationUsers,
                                                             employeeService,
                                                             rootEntity,
                                                             lookupService,
                                                             Information) {
        'ngInject';
        var self = this;
        self.controllerName = 'followupEmployeeInboxPopCtrl';

        self.inlineOUSearchText = '';
        self.inlineAppUserSearchText = '';
        self.isFollowupSentItems = isFollowupSentItems;

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

        self.applicationUsers = applicationUsers;

        self.selectedOrganizationCopy = angular.copy(selectedOrganization);
        self.selectedApplicationUserCopy = angular.copy(selectedUser);
        self.selectedSecurityLevelsCopy = angular.copy(selectedSecurityLevels);

        self.selectedOrganization = selectedOrganization || null;
        self.selectedApplicationUser = selectedUser || null;
        self.selectedSecurityLevels = selectedSecurityLevels || null;

        var _mapSecurityLevels = function () {
            if (!self.selectedOrganization)
                return [];

            return _.filter(self.organizations, function (ou) {
                return ou.id === self.selectedOrganization;
            })[0].securityLevels;
        };
        self.securityLevels = _mapSecurityLevels();
        /**
         * @description Get the Application Users and security levels for the selected Organization
         */
        self.getAppUsersAndSecurityLevelsForOU = function ($event) {
            self.selectedApplicationUser = null;
            self.selectedSecurityLevels = null;
            // get security level
            self.securityLevels = _mapSecurityLevels();

            return distributionWFService
                .searchUsersByCriteria({ou: self.selectedOrganization})
                .then(function (result) {
                    self.applicationUsers = result;
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
                    securityLevels: self.selectedSecurityLevels
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

    });
};
