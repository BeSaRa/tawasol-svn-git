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
                                                     $state,
                                                     dialog,
                                                     contextHelpService) {
        'ngInject';
        var self = this;
        self.controllerName = 'toolbarDirectiveCtrl';

        self.loadingService = loadingIndicatorService;
        self.employeeService = employeeService;
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

    });
};
