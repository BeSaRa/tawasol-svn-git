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
        self.lastOpendItem = null;

        self.dynamicMenuItems = [];
        self.dynamicMenuParents = [];
        self.dynamicMenuChildren = {};


        self.allParents = [];

        self.setDynamicMenuItems = function (dynamicMenuItems) {
            self.dynamicMenuItems = dynamicMenuItems;
        };


        self.prepareDynamicMenuItems = function () {
            self.dynamicMenuItems = _.map(self.dynamicMenuItems, function (dynamicMenuItem) {
                return new MenuItem({
                    ID: 'd' + dynamicMenuItem.id,
                    parent: dynamicMenuItem.parent ? 'd' + dynamicMenuItem.parent : null,
                    dynamicMenuItem: dynamicMenuItem,
                    lang_key: dynamicMenuItem.generateLangKey(),
                    active: dynamicMenuItem.status,
                    icon: dynamicMenuItem.getDynamicMenuIcon(),
                    state: dynamicMenuItem.generateState(),
                    sort_order: dynamicMenuItem.itemOrder
                })
            });
            self.getMenuHierarchy();
            self.getDynamicMenuHierarchy(self.dynamicMenuItems);
            self.allParents = self.menuParents.concat(self.dynamicMenuParents);
            return self.allParents;
        };

        self.getDynamicMenuHierarchy = function (menuItems) {
            self.dynamicMenuParents = [];
            self.dynamicMenuChildren = {};

            _.map(menuItems, function (item) {
                if (!item.parent) {
                    self.dynamicMenuParents.push(item);
                } else {
                    if (!self.dynamicMenuChildren.hasOwnProperty(item.parent)) {
                        self.dynamicMenuChildren[item.parent] = [];
                    }
                    self.dynamicMenuChildren[item.parent].push(item);
                }
            });

            _.map(self.dynamicMenuParents, function (item, index) {
                self.dynamicMenuParents[index].children = self.dynamicMenuChildren.hasOwnProperty(item.ID) ? self.dynamicMenuChildren[item.ID] : [];
            });

            _.map(self.dynamicMenuParents, function (item, index) {
                _.map(self.dynamicMenuParents[index].children, function (child, childIndex) {
                    self.dynamicMenuParents[index].children[childIndex].myParent = angular.copy(self.dynamicMenuParents[index]);
                });
            });

            return self.dynamicMenuParents;
        };

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
        };

        self.getDynamicMenuItemByID = function (dynamicMenuItemId) {
            return _.find(self.dynamicMenuItems, function (item) {
                return item.ID === dynamicMenuItemId;
            });
        };

        self.toggleMenuItem = function (menuItem) {
            menuItem.toggleItem();
            _.map(self.menuItems, function (item) {
                item.ID !== menuItem.ID && item.closeItem();
            })
        }


    });
};
