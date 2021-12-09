module.exports = function (app) {
    app.service('sidebarService', function (_,
                                            $rootScope,
                                            Sidebar,
                                            generator,
                                            urlService,
                                            langService,
                                            employeeService,
                                            MenuItem,
                                            $q,
                                            $http,
                                            dynamicMenuItemService) {
        'ngInject';
        var self = this;
        // predefined sidebars
        self.sidebars = [
            new Sidebar({
                id: 1,
                code: 'main-sidebar',
                isLockedOpen: true,
                isOpen: true
            })
        ];
        self.menuItems = [];
        self.menuParents = [];
        self.menuChildren = {};
        self.lastOpenedItem = null;

        self.dynamicMenuItems = [];
        self.dynamicMenuParents = [];
        self.dynamicMenuChildren = {};


        self.allParents = [];

        self.sidebarLoaded = false;

        self.setDynamicMenuItems = function (dynamicMenuItems) {
            var isICNEntryOrSearchTemplate = false, index;
            self.dynamicMenuItems = _.filter(dynamicMenuItems, function (menuItem) {
                isICNEntryOrSearchTemplate = menuItem.isICNEntryTemplateOrSearchType();
                if (!isICNEntryOrSearchTemplate) {
                    return true;
                } else {
                    if (menuItem.getMenuType() === 'icnEntryTemplate') {
                        index = _.findIndex(employeeService.getEmployee().permissions, function (permission) {
                            return permission.id === -1;
                        });
                        if (index === -1) {
                            employeeService.getEmployee().permissions.push({
                                id: -1,
                                permissionKey: 'ICN_ENTRY_TEMPLATE'
                            });
                        }
                    } else if (menuItem.getMenuType() === 'icnSearchTemplate') {
                        index = _.findIndex(employeeService.getEmployee().permissions, function (permission) {
                            return permission.id === -2;
                        });
                        if (index === -1) {
                            employeeService.getEmployee().permissions.push({
                                id: -2,
                                permissionKey: 'ICN_SEARCH_TEMPLATE'
                            });
                        }
                    }
                    return false;
                }
            });
            self.prepareDynamicMenuItems();
        };

        self.isICNEntryTemplateOrSearchType = function (menuItem) {
            menuItem = menuItem.hasOwnProperty('menuType') ? menuItem.menuType : menuItem;
            // icnSearchTemplate = 4, icnEntryTemplate = 3
            return menuItem === dynamicMenuItemService.dynamicMenuItemsTypes.icnSearchTemplate
                || menuItem === dynamicMenuItemService.dynamicMenuItemsTypes.icnEntryTemplate;
        };
        var specialItems = ['menu_item_outgoing', 'menu_item_internal', 'menu_item_incoming'];

        function _appendAllChildNameToParent(item) {
            item.searchText = (item.translate + '|' + (_.map(item.children, function (i) {
                i.searchText = i.translate;
                if (specialItems.indexOf(item.lang_key) !== -1) {
                    i.searchText += item.translate;
                }
                return i.searchText;
            })).join('|'));
        }


        self.prepareDynamicMenuItems = function () {
            var dynamicMenuItems = _.map(self.dynamicMenuItems, function (dynamicMenuItem) {
                return new MenuItem({
                    ID: 'd' + dynamicMenuItem.id,
                    parent: dynamicMenuItem.parent ? 'd' + dynamicMenuItem.parent : null,
                    dynamicMenuItem: dynamicMenuItem,
                    lang_key: dynamicMenuItem.generateLangKey(),
                    active: dynamicMenuItem.status,
                    icon: dynamicMenuItem.getDynamicMenuIcon(),
                    state: dynamicMenuItem.generateState(),
                    sort_order: (dynamicMenuItem.itemOrder + 100)
                })
            });
            self.getMenuHierarchy();
            self.getDynamicMenuHierarchy(dynamicMenuItems);
            self.allParents = self.menuParents.concat(self.dynamicMenuParents);
            self.allParents.map(_appendAllChildNameToParent);
            langService.listeningToChange(function () {
                self.allParents.map(_appendAllChildNameToParent);
            });
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
                    var menuItem = angular.copy(self.dynamicMenuParents[index]);
                    delete menuItem.children;
                    self.dynamicMenuParents[index].children[childIndex].myParent = menuItem;
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
            return $http.get(urlService.menus, {
                params: {
                    version: app.$_privateBuildNumber
                }
            }).then(function (result) {
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
            dynamicMenuItemId = Number(dynamicMenuItemId.replace('d', ''));
            return _.find(self.dynamicMenuItems, function (item) {
                return item.id === dynamicMenuItemId;
            });
        };

        self.toggleMenuItem = function (menuItem) {
            menuItem.toggleItem();
            _.map(self.allParents, function (item) {
                item.ID !== menuItem.ID && item.closeItem();
            });
        }


    });
};
