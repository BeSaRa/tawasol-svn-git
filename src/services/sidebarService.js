module.exports = function (app) {
    app.service('sidebarService', function (_,
                                            $rootScope,
                                            Sidebar,
                                            generator,
                                            urlService,
                                            employeeService,
                                            MenuItem,
                                            $q,
                                            $http) {
        'ngInject';
        var self = this;
        // predefined sidebars
        self.sidebars = [
            new Sidebar({
                id: 1,
                code: 'main-sidebar',
                isLockedOpen: false,
                isOpen: true
            })
        ];
        self.menuItems = [];
        self.menuParents = [];
        self.menuChildren = {};
        /**
         * get sidebar by code
         * @param sidebarCode
         * @returns {Sidebar}
         */
        self.getSidebar = function (sidebarCode) {
            return _.find(self.sidebars, function (sidebar) {
                return sidebar.code === sidebarCode;
            });
        };
        /**
         * load menus
         */
        self.loadMenuItems = function () {
            return $http.get(urlService.menus).then(function (result) {
                self.menuItems = generator.generateCollection(result.data, MenuItem);
                self.menuItems = generator.interceptReceivedCollection('MenuItem', self.menuItems);
                return self.menuItems;
            });
        };
        /**
         * return menus
         * @returns {Promise}
         */
        self.getMenuItems = function () {
            return self.menuItems.length ? $q.when(self.menuItems) : self.loadMenuItems();
        };
        /**
         * get list of menus with hierarchy
         * @returns {Array}
         */
        self.getMenuHierarchy = function () {
            self.menuParents = [];
            self.menuChildren = {};

            _.map(self.menuItems, function (item) {
                if (!item.parent) {
                    self.menuParents.push(item);
                } else {
                    if (!self.menuChildren.hasOwnProperty(item.parent)) {
                        self.menuChildren[item.parent] = [];
                    }
                    self.menuChildren[item.parent].push(item);
                }
            });

            _.map(self.menuParents, function (item, index) {
                self.menuParents[index].children = self.menuChildren.hasOwnProperty(item.ID) ? self.menuChildren[item.ID] : [];
            });
            return self.menuParents;
        };

        self.getMenuItemByID = function (menuItem) {
            var id = menuItem.hasOwnProperty('id') ? menuItem.id : menuItem;
            return _.find(self.menuItems, function (menu) {
                return Number(menu.ID) === Number(id);
            });
        }


    });
};