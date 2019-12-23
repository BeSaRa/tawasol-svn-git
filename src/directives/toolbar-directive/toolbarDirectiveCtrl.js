module.exports = function (app) {
    app.controller('toolbarDirectiveCtrl', function ($mdSidenav,
                                                     scannerService,
                                                     loadingIndicatorService,
                                                     employeeService,
                                                     sidebarService,
                                                     langService,
                                                     themeService,
                                                     rootEntity,
                                                     $mdMedia,
                                                     authenticationService,
                                                     privateAnnouncementService,
                                                     $state,
                                                     dialog,
                                                     contextHelpService,
                                                     toast,
                                                     errorCode) {
        'ngInject';
        var self = this;
        self.controllerName = 'toolbarDirectiveCtrl';

        self.loadingService = loadingIndicatorService;
        self.employeeService = employeeService;
        self.employee = employeeService.getEmployee();
        self.themeService = themeService;

        self.toggleSidebar = function (sidebarId) {
            $mdSidenav(sidebarId).toggle();
            if (sidebarId === 'right-sidebar' && !self.themeService.themes.length) {
                self.themeService.getThemes();
            }
        };

        self.toggleSidebarLocked = function (sidebarCode) {
            return sidebarService.getSidebar(sidebarCode).toggleLocked();
        };

        self.sizeXS = function () {
            return $mdMedia('xs');
        };

        /**
         * @description open help popup
         */
        self.openHelp = function () {
            contextHelpService.openContextHelp();
        };

        /**
         * logout employee
         */
        self.logoutEmployee = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_logout'), null, null, $event)
                .then(function () {
                    authenticationService.logout().then(function () {
                        $state.go('login', {identifier: rootEntity.getRootEntityIdentifier()});
                    });
                });
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
                    self.employee = employeeService.getEmployee();
                    $state.reload().then(function () {
                        privateAnnouncementService.openPrivateAnnouncementsDialog(true);
                    })
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'INACTIVE_USER_ENTITY', function () {
                        toast.error(langService.get('can_not_login_with_inactive_user_or_entity'));
                    });
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

            return organization.id === self.employee.organization.ouid;
        };


        /**
         * set direction for menu content
         * @param $event
         * @returns {string}
         */
        self.getPositionMode = function ($event) {
            var dir = langService.current === 'ar' ? 'left' : 'right';

            return dir + " bottom";
        };

        self.openUserOrganizationMenu = function ($mdMenu) {
            if (self.employee.ouList.length > 1)
                $mdMenu.open();
        };
    });
};
