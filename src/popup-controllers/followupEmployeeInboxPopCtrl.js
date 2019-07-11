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
                                                             followUpOrganizations,
                                                             ouApplicationUsers,
                                                             employeeService,
                                                             Information) {
        'ngInject';
        var self = this;
        self.controllerName = 'followupEmployeeInboxPopCtrl';

        self.inlineOUSearchText = '';

        var _mapRegOUSections = function(){
            // filter all regOU
            var regOus = _.filter(followUpOrganizations, function (item) {
                return item.hasRegistry;
            });
            regOus = _.map(regOus, function (regOu) {
                regOu.tempRegOUSection = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });

            // filter all sections (no registry)
            var sections = _.filter(followUpOrganizations, function (item) {
                return !item.hasRegistry;
            });

            // if needed to show regou - section, append the dummy property "tempRegOUSection"
            sections = _.map(sections, function (item) {
                // if ou is section(has no registry and has regOuId, add temporary field for regOu)
                var regOu = _.find(followUpOrganizations, function (ou) {
                    return ou.id === (item.regouId || item.regOuId);
                });
                item.tempRegOUSection = new Information({
                    arName: regOu.arName + ' - ' + item.arName,
                    enName: regOu.enName + ' - ' + item.enName
                });
                return item;
            });
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
                    availableUsers: self.ouApplicationUsers
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
            var code = $event.which || $event.keyCode;
            if (code !== 38 && code !== 40)
                $event.stopPropagation();
        };

    });
};
