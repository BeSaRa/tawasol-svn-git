module.exports = function (app) {
    app.controller('userMenuDirectiveCtrl', function (employeeService,
                                                      $timeout,
                                                      $state,
                                                      rootEntity,
                                                      counterService,
                                                      dialog,
                                                      authenticationService,
                                                      applicationUserService,
                                                      moveToFolderService,
                                                      toast,
                                                      langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'userMenuDirectiveCtrl';
        self.employee = employeeService.getEmployee();
        self.employeeService = employeeService;

        // selected status by default
        self.selectedStatus = {
            id: 1,
            title: 'Online',
            icon: 'check-circle',
            class: 'online-status'
        };
        // away -> clock
        // online -> check-circle
        // don't disturb -> minus-circle
        // invisible -> circle-outline - disabled
        // offline -> circle-outline
        self.statusList = [
            {
                id: 1,
                title: 'Online',
                icon: 'check-circle',
                class: 'online-status'
            },
            {
                id: 2,
                title: 'Away',
                icon: 'clock',
                class: 'away-status'
            },
            {
                id: 3,
                title: 'Do not Disturb',
                icon: 'minus-circle',
                class: 'disturb-status'
            },
            {
                id: 4,
                title: 'Invisible',
                icon: 'circle-outline',
                class: 'invisible-status'
            },
            {
                id: 5,
                title: 'Offline',
                icon: 'circle-outline',
                class: 'offline-status'
            }
        ];
        /**
         * select status from available status to set it selectedStatus variable .
         * @param status
         */
        self.selectStatus = function (status) {
            self.selectedStatus = status;
        };
        /**
         * to check if the given status selected
         * @param status
         * @return {boolean}
         */
        self.isStatusSelected = function (status) {
            return status.id === self.selectedStatus.id;
        };

        // deprecated method
        self.getOffset = function () {
            return '-15 0';
        };
        /**
         * @description Opens the popup for user preferences
         * @param $event
         */
        self.userPreferences = function ($event) {
            applicationUserService
                .controllerMethod
                .manageUserPreference(null, $event)
        };
        /**
         * @description switch organization
         * @param organization
         * @returns {boolean}
         */
        self.switchOrganization = function (organization) {
            if (self.isCurrentOrganization(organization))
                return true;

            authenticationService
                .selectDepartmentToLogin(organization)
                .then(function () {
                    $state.reload();
                });
        };
        /**
         * @description if the current organization is selected.
         * @param organization
         * @returns {boolean}
         */
        self.isCurrentOrganization = function (organization) {
            if (!organization)
                return false;

            return organization.id === self.employee.userOrganization.id;
        };

        /**
         * @description open popup to move work items from one folder to another
         */
        self.moveToFolders = function () {
            moveToFolderService.controllerMethod.moveToFolder().then(function () {

            });
        };

        /**
         * logout employee
         */
        self.logoutEmployee = function () {
            authenticationService.logout().then(function () {
                $state.go('login', {identifier: rootEntity.getRootEntityIdentifier()});
            });
        };

        self.openUserMenu = function ($mdMenu) {
            if (!employeeService.isAdminUser()) {
                $mdMenu.open();
            } else {
                dialog.infoMessage(langService.get('this_is_a_super_admin'))
            }
        }
    });
};
