module.exports = function (app) {
    app.controller('sidebarMenuDirectiveCtrl', function ($state,
                                                         counterService,
                                                         employeeService,
                                                         LangWatcher,
                                                         permissionService,
                                                         generator,
                                                         sidebarService,
                                                         rootEntity,
                                                         quickSearchCorrespondenceService,
                                                         $timeout,
                                                         reportService,
                                                         $scope,
                                                         langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'sidebarMenuDirectiveCtrl';
        self.counters = counterService;
        LangWatcher($scope);

        self.navigateToLink = function (item, $event) {
            $event.preventDefault();
            if (!item.children.length) {
                if (item.isDynamic) {
                    var state = item.dynamicMenuItem.generateState();
                    $state.go(state, {
                        identifier: rootEntity.getRootEntityIdentifier(),
                        menuId: item.ID
                    });
                    // $state.go(item.state, {
                    //     identifier: rootEntity.getRootEntityIdentifier(),
                    //     reportName: report.reportName
                    // });
                } else {
                    if (item.state === 'app.search-screen' && self.isCurrentState(item)) {
                        generator.selectedSearchCtrl.controller.selectedTab = 0;
                    }
                    $state.go(item.state, {identifier: rootEntity.getRootEntityIdentifier()});
                }
                quickSearchCorrespondenceService.hideSearchForm().emptySearchInput();
                return;
            }
            var menu = angular.element('#menu-id-' + item.ID).children('ul');
            sidebarService.toggleMenuItem(item);
        };

        self.isCurrentState = function (item) {
            if (item.isDynamic) {
                return $state.includes(item.state, {menuId: item.ID});
            } else {
                return $state.includes(item.state);
            }
        };

        self.getMenuState = function (item) {
            return item.dynamicMenuItem.generateState() + '({menuId:item.ID})';
        };

        self.showMenuItem = function (item) {
            return employeeService.employeeHasPermissionTo(item);
        };

        /**
         * @description Gets the tooltip for menu item
         * @param item
         * @returns {string}
         */
        self.getTooltip = function (item) {
            var text = langService.get(item.lang_key);
            if (typeof (self.counters.counter.hasCounter) === 'undefined') {
                return '';
            }
            return self.counters.counter.hasCounter(item.lang_key)
                ? (text.length > 15 ? text : '')
                : (text.length > 25 ? text : '')
        };
    });
};
