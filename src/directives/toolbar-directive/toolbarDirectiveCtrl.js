module.exports = function (app) {
    app.controller('toolbarDirectiveCtrl', function ($mdSidenav,
                                                     scannerService,
                                                     loadingIndicatorService,
                                                     employeeService,
                                                     sidebarService,
                                                     themeService,
                                                     $mdMedia,
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

    });
};
