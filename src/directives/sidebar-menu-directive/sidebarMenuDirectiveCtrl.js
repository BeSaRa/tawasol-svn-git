module.exports = function (app) {
    app.controller('sidebarMenuDirectiveCtrl', function ($state,
                                                         counterService,
                                                         employeeService,
                                                         LangWatcher,
                                                         permissionService,
                                                         sidebarService,
                                                         rootEntity,
                                                         quickSearchCorrespondenceService,
                                                         $timeout,
                                                         $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'sidebarMenuDirectiveCtrl';
        self.counters = counterService;
        LangWatcher($scope);

        self.navigateToLink = function (item, $event) {
            $event.preventDefault();
            if (!item.children.length) {
                $state.go(item.state, {identifier: rootEntity.getRootEntityIdentifier()});
                quickSearchCorrespondenceService.hideSearchForm().emptySearchInput();
                return;
            }
            var menu = angular.element('#menu-id-' + item.ID).children('ul');
            sidebarService.toggleMenuItem(item);
            // $timeout(function () {
            //     menu.parent().siblings('li.has-child').children('ul').slideUp('fast').end().removeClass('opend');
            // }).then(function () {
            //     menu.slideToggle('fast', function () {
            //         $timeout(function () {
            //
            //             menu.removeAttr('style');
            //         })
            //     });
            // });


        };

        self.isCurrentState = function (item) {
            return $state.includes(item.state);
        };

        self.showMenuItem = function (item) {
            return employeeService.employeeHasPermissionTo(item);
        }
    });
};
