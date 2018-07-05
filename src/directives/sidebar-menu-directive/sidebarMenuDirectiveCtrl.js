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
                                                         reportService,
                                                         $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'sidebarMenuDirectiveCtrl';
        self.counters = counterService;
        LangWatcher($scope);

        self.navigateToLink = function (item, $event) {
            $event.preventDefault();
            if (!item.children.length) {
                var report = reportService.getReportByKey(item.lang_key);
                if (report) {
                    $state.go(item.state, {
                        identifier: rootEntity.getRootEntityIdentifier(),
                        reportName: report.reportName
                    });
                } else {
                    $state.go(item.state, {identifier: rootEntity.getRootEntityIdentifier()});
                }
                quickSearchCorrespondenceService.hideSearchForm().emptySearchInput();
                return;
            }
            var menu = angular.element('#menu-id-' + item.ID).children('ul');
            sidebarService.toggleMenuItem(item);
        };

        self.isCurrentState = function (item) {
            return $state.includes(item.state);
        };

        self.showMenuItem = function (item) {
            return employeeService.employeeHasPermissionTo(item);
        }
    });
};
