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
                                                             organizations,
                                                             ouApplicationUsers,
                                                             employeeService) {
            'ngInject';
            var self = this;
            self.controllerName = 'followupEmployeeInboxPopCtrl';

            self.validateLabels = {};

            self.organizations = organizations;
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
                        result = _.filter(result, function (ouApplicationUser) {
                            return ouApplicationUser.applicationUser.id != employeeService.getEmployee().id;
                        });
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
                        applicationUser: self.selectedApplicationUser
                    }
                );
            };

            /**
             * @description Close the popup
             */
            self.closeFollowupEmployeeInboxPopupFromCtrl = function () {
                dialog.cancel();
            }
        }
    )
    ;
};