module.exports = function (app) {
    app.controller('followupEmployeeInboxPopCtrl', function (ouApplicationUserService,
                                                             _,
                                                             toast,
                                                             generator,
                                                             dialog,
                                                             langService,
                                                             Organization,
                                                             ApplicationUser,
                                                             currentOrganization,
                                                             currentEmployee,
                                                             organizations,
                                                             applicationUsers) {
            'ngInject';
            var self = this;
            self.controllerName = 'followupEmployeeInboxPopCtrl';

            self.validateLabels = {};

            self.organizations = organizations;
            self.applicationUsers = applicationUsers;

            self.selectedOrganizationCopy = angular.copy(currentOrganization);
            self.selectedApplicationUserCopy = angular.copy(currentEmployee);

            self.selectedOrganization = currentOrganization || null;
            self.selectedApplicationUser = currentEmployee || null;

            /**
             * @description Get the Application Users for the selected Organization
             */
            self.getApplicationUsersForOU = function ($event) {
                self.selectedApplicationUser = null;
                return ouApplicationUserService.loadRelatedOUApplicationUsers(self.selectedOrganization)
                    .then(function (result) {
                        self.applicationUsers = result;
                        return result;
                    });
            };

            /**
             * @description Get Applicaiton
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