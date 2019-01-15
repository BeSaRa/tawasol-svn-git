module.exports = function (app) {
    app.controller('applicationUserPrivateMenuCtrl', function (dynamicMenuItems,
                                                               dynamicMenuItemService,
                                                               $timeout,
                                                               layoutService,
                                                               _,
                                                               langService,
                                                               ouApplicationUser,
                                                               employeeService,
                                                               toast,
                                                               userMenuItems,
                                                               dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserPrivateMenuCtrl';

        self.userMenuItems = userMenuItems;

        self.selectedMenuItems = [];

        self.dynamicMenuItems = _.chunk(dynamicMenuItems, 3);


        function _getItemIds(arrayOfUserMenuItems) {
            return _.map(arrayOfUserMenuItems, 'menuItem.id');
        }

        function _updateSelectedMenuItem() {
            var ids = _getItemIds(self.userMenuItems);
            console.log(ids);
            _.map(dynamicMenuItems, function (item, index) {
                ids.indexOf(item.menuItem.id) !== -1 ? self.selectedMenuItems.push(dynamicMenuItems[index]) : null;
            });
        }

        $timeout(function () {
            _updateSelectedMenuItem();
        });

        self.toggleMenuItem = function (item) {
            !self.existsMenuItem(item) ? self.selectedMenuItems.push(item) : self.selectedMenuItems.splice(self.selectedMenuItems.indexOf(item), 1)
        };

        self.existsMenuItem = function (item) {
            var ids = _getItemIds(self.selectedMenuItems);
            return ids.indexOf(item.menuItem.id) !== -1;
        };

        self.saveSelectedMenuItems = function () {
            dynamicMenuItemService
                .saveBulkUserMenuItems(self.selectedMenuItems)
                .then(function () {
                    if (employeeService.isCurrentOUApplicationUser(ouApplicationUser)) {
                        layoutService.loadLandingPage();
                    }
                    toast.success(langService.get('save_success'));
                    dialog.hide();
                })
        };

        self.closeDialog = function () {
            dialog.cancel();
        }


    });
};
