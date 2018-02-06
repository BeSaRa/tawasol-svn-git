module.exports = function (app) {
    /**
     * @name permissionServiceProvider
     */
    app.provider('permissionService', function () {
        'ngInject';
        var self = this, menuItems = {}, menuGroups = {};


        function MenuGroup(translate) {
            this.groupKey = translate;
            this[this.groupKey] = [];
            this.returnValidPermission = function (item) {
                return typeof item === 'function' ? item : item.toLowerCase();
            };
            this.addMenuPermissions = function (menuKey, permissions) {
                self.addMenuPermissions(menuKey, permissions);
                this[this.groupKey] = this[this.groupKey].concat(permissions).map(this.returnValidPermission);
                return this;
            };
            this.addMenuPermission = function (menuKey, permission) {
                self.addMenuPermission(menuKey, permission);
                this[this.groupKey] = this[this.groupKey].concat([permission]).map(this.returnValidPermission);
                return this;
            };

            this.getPermissions = function () {
                return this[this.groupKey];
            };

            this.end = function () {
                return self;
            }
        }

        /**
         * @description add new permissions to MenuITem
         * @param menuKey
         * @param permission
         * @return {permissionService}
         */
        self.addMenuPermission = function (menuKey, permission) {
            if (!menuItems.hasOwnProperty(menuKey)) {
                menuItems[menuKey] = [];
            }
            permission = typeof permission === 'function' ? permission : permission.toLowerCase();
            menuItems[menuKey].push(permission);
            return self;
        };
        /**
         * @description add collections of permissions to menu
         * @param menuKey
         * @param permissions
         * @return {permissionServiceProvider}
         */
        self.addMenuPermissions = function (menuKey, permissions) {
            if (!angular.isArray(permissions)) {
                return self.addMenuPermission(menuKey, permissions);
            }

            for (var i = 0; i < permissions.length; i++) {
                self.addMenuPermission(menuKey, permissions[i]);
            }
            return self;
        };
        /**
         * @description get all menuItems with permissions
         * @return {{}}
         */
        self.getMenuPermissions = function (menuItem) {
            var key = menuItem.hasOwnProperty('lang_key') ? menuItem.lang_key : menuItem;
            var permissions = (menuGroups[key] ? menuGroups[key].getPermissions() : false) || menuItems[key] || [];
            return {
                type: menuGroups.hasOwnProperty(key) ? 'group' : 'item',
                permissions: menuGroups.hasOwnProperty(key) ? menuGroups[key].getPermissions() : permissions
            };
        };
        /**
         * @description get all menu permissions
         * @return {{}}
         */
        self.getAllMenuPermissions = function () {
            return menuItems;
        };
        /**
         * add menu group to check with ||
         * @param menuKey
         * @return {*}
         */
        self.addMenuPermissionGroup = function (menuKey) {
            menuGroups[menuKey] = new MenuGroup(menuKey);
            return menuGroups[menuKey];
        };

        /**
         * @name permissionService
         * @return {{getMenuPermissions: (permissionServiceProvider.getMenuPermissions|*), getAllMenuPermissions: (permissionServiceProvider.getAllMenuPermissions|*)}}
         */
        self.$get = function () {
            'ngInject';
            return {
                /**
                 * @name getMenuPermissions
                 * @description return all given menuItem Permissions
                 */
                getMenuPermissions: self.getMenuPermissions,
                /**
                 * @name getAllMenuPermissions
                 * @description get all menuItem Permissions
                 */
                getAllMenuPermissions: self.getAllMenuPermissions
            };
        };
    })
};