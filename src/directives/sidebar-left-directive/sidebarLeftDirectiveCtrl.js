module.exports = function (app) {
    app.controller('sidebarLeftDirectiveCtrl', function (sidebarService, $scope, _, rootEntity, $mdMedia) {
        'ngInject';
        var self = this;
        self.controllerName = 'sidebarLeftDirectiveCtrl';
        self.items = sidebarService.prepareDynamicMenuItems();
        self.rootEntity = rootEntity;
        self.service = sidebarService;
        self.search = '';
        self.toggleSidebarLocked = function (sidebarCode) {
            return sidebarService.getSidebar(sidebarCode).toggleLocked();
        };

        self.sidebarStatus = function (sidebarCode) {
            return sidebarService.getSidebar(sidebarCode).isLockedOpen && $mdMedia('gt-sm');
        };

        self.isGreatThanSmall = function () {
            return $mdMedia('gt-sm');
        };

        self.checkSidebarScroll = function () {
            return !sidebarService.getSidebar('main-sidebar').isLockedOpen;
        };

        $scope.$on('$currentEmployeePermissionsChanged', function () {
            self.items = sidebarService.getMenuHierarchy();
        });

        self.$onInit = function () {
            sidebarService.sidebarLoaded = true;
        }

    });
};
