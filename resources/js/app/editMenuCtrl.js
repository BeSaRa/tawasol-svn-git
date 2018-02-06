(function (app) {
    app.controller('editMenuCtrl', function ($scope, menuService, $mdDialog, langDevService) {
        'ngInject';
        $scope.langService = langDevService;

        $scope.editMenuItem = function (item) {
            $mdDialog
                .show({
                    templateUrl: 'views/edit.html',
                    locals: {
                        item: item
                    },
                    controllerAs: 'ctrl',
                    controller: function (item, langDevService, $element ) {
                        var self = this;
                        $element.find('input').on('keydown', function (ev) {
                            ev.stopPropagation();
                        });
                        self.translate = langDevService.getLangKey(item.lang_key);
                        self.item = angular.copy(item);
                        self.close = function () {
                            $mdDialog.cancel();
                        };

                        self.save = function () {
                            menuService.editMenuItem(self.item).then(function () {
                                menuService.loadMenus()
                            });
                        }
                    }
                })
        };

        $scope.selectMenuItem = function (item, $event) {
            $event.stopPropagation();
            if (!$scope.isSelected(item))
                menuService.setSelectedMenu(item);
            else
                $scope.emptySelectedMenu($event);
        };
        $scope.emptySelectedMenu = function ($event) {
            $event.stopPropagation();
            menuService.setSelectedMenu(null);
        };
        $scope.isSelected = function (item) {
            return menuService.hasSelectedItem() ? (item.ID === menuService.selectedItem.ID) : false;
        }

    })
})(app);