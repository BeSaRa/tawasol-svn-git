(function (app) {
    app.service('menuService', function ($http) {
        'ngInject';
        var self = this,
            url = 'api.php',
            menuIDKey = 'ID';

        self.menus = [];
        self.children = {};
        self.parents = [];
        self.selectedItem = null;
        /**
         * load menus
         */
        self.loadMenus = function () {
            return $http.get(url).then(function (result) {
                self.menus = result.data;
                self.prepareMenus().generateHierarchy();
                return self.parents;
            });
        };
        /**
         * set selected item icon
         * @param icon
         */
        self.setSelectedItemIcon = function (icon) {
            self.selectedItem.icon = icon;
            return $http.post(url + '?action=setIcon', self.selectedItem).then(function (result) {
                return result.data;
            });
        };

        self.editMenuItem = function (item) {
            delete item.children;
            return $http.put(url + '?action=editMenuItem', item).then(function (result) {
                return result.data;
            });
        };
        /**
         * prepare menu
         * @returns {*}
         */
        self.prepareMenus = function () {
            self.children = {};
            self.parents = [];

            for (var i = 0; i < self.menus.length; i++) {
                if (!self.menus[i].parent) {
                    self.parents.push(self.menus[i]);
                } else {
                    if (!self.children.hasOwnProperty(self.menus[i].parent)) {
                        self.children[self.menus[i].parent] = [];
                    }
                    self.children[self.menus[i].parent].push(self.menus[i]);
                }
            }
            return self;
        };

        self.generateHierarchy = function () {
            for (var i = 0; i < self.parents.length; i++) {
                self.parents[i].children = self.getChildrenTo(self.parents[i]);
            }
            return self;
        };

        self.getChildrenTo = function (menu) {
            var children = [];
            if (self.children.hasOwnProperty(menu[menuIDKey])) {
                children = self.children[menu[menuIDKey]];
            }
            return children;
        };

        self.getMenuItemByID = function (id) {
            id = Number(id);
            var item;
            for (var i = 0; i < self.menus.length; i++) {
                if (self.menus[i].ID === id) {
                    item = self.menus[i];
                    break;
                }
            }
            return item;
        };

        self.prepareItem = function (item) {
            delete item.children;
            return item;
        };

        self.prepareCollection = function (collection) {
            for (var i = 0; i < collection.length; i++) {
                self.prepareItem(collection[i]);
            }
            return collection;
        };

        self.updateMenus = function (menuItems) {
            var items = self.prepareCollection(angular.copy(menuItems));
            return $http.patch(url, items).then(function (result) {
                return result.data;
            });
        };

        self.setSelectedMenu = function (item) {
            self.selectedItem = item;
        };

        self.hasSelectedItem = function () {
            return self.selectedItem;
        }

    })
})(app);