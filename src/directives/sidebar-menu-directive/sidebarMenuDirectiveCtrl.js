module.exports = function (app) {
    app.controller('sidebarMenuDirectiveCtrl', function ($state,
                                                         counterService,
                                                         employeeService,
                                                         LangWatcher,
                                                         permissionService,
                                                         rootEntity,
                                                         quickSearchCorrespondenceService,
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
            menu.parents('li').siblings('.has-child').children('ul').slideUp('fast');
            menu.slideToggle('fast', function () {
                $scope.$apply(function () {
                    item.open = !item.open;
                });
            });

        };

        self.isCurrentState = function (item) {
            return $state.includes(item.state);
        };

        self.showMenuItem = function (item) {
            return employeeService.employeeHasPermissionTo(item);
        }
    });
};
