module.exports = function (app) {
    app.service('employeeService', function ($cookies,
                                             Employee,
                                             lookupService,
                                             generator,
                                             permissionService) {
        'ngInject';
        var self = this, employee = null,
            employeeCookiesKey = 'CMSEmployee', rootEntity, langService;

        self.serviceName = 'employeeService';

        /**
         * get the employee from cookies
         * @return {Employee}
         * @private
         */
        function _getEmployeeFromCookies() {
            var cookiesEmployee = $cookies.get(employeeCookiesKey);
            return cookiesEmployee ? new Employee(cookiesEmployee) : cookiesEmployee;
        }

        function _getCurrentOUApplicationUser() {
            return employee ? employee.organization : null;
        }

        /**
         * destroy current employee data with cookies and cached
         * @private
         */
        function _destroyEmployeeCookies() {
            employee = null;
            $cookies.remove(employeeCookiesKey);
        }

        /**
         * create employee cookies and cached data
         * @param result
         * @return {*}
         * @private
         */
        function _createEmployeeCookies(result) {
            if (result.isAdminUser) {
                employee = new Employee({
                    arFullName: 'SuperAdmin',
                    enFullName: 'SuperAdmin',
                    isAdmin: true,
                    defaultDisplayLang: 1,
                    isCloudAdmin: result.isCloudAdmin
                });
                if (result.isAdminUser) {
                    employee.setPermissions(result.permissions); // set permissions
                    return self;
                }
            } else {
                employee = generator.interceptReceivedInstance('ApplicationUser', new Employee(result.userInfo));
            }
            // set globalSetting for root entity
            if (result.hasOwnProperty('globalSetting') && result.globalSetting)
                rootEntity.setFileTypesHashMap(result.globalSetting.fileTypesMap);
            // var date = (new Date());
            // date.setYear(date.getFullYear() + 1);
            employee.setPermissions(result.permissions); // set permissions
            employee.setProxyUsers(result.proxyUsers); // set proxy Users for current logged in employee.
            employee.setOrganization(result.ou); // set current organization for logged in employee.
            employee.setOuList(result.ouList);
            lookupService.setPropertyConfigurations(result.propertyConfiguration);
            employee.loadOrganization();
            return self;
        }

        /**
         * set employee to cookies and save it as private variable inside the service
         * @return Employee
         * @param result
         */
        self.setEmployee = function (result) {
            // create instance from Employee Model.
            return _createEmployeeCookies(result);
        };
        /**
         * set current ou application user for current logged in user.
         * @param ouApplicationUser
         */
        self.setCurrentOUApplicationUser = function (ouApplicationUser) {
            return employee.setOrganization(ouApplicationUser);
        };
        /**
         * @description get proxy users for current logged in user.
         * @return {*}
         */
        self.getProxyUsers = function () {
            return employee.proxyUsers;
        };

        self.getCurrentOUApplicationUser = function () {
            return _getCurrentOUApplicationUser();
        };
        /**
         * get employee from service or get it from cookies if found
         * @return {Employee | null }
         */
        self.getEmployee = function () {
            return employee ? employee : _getEmployeeFromCookies();
        };

        self.getTranslatedName = function () {
            return employee ? employee.getTranslatedName() : null;
        };
        /**
         * destroy current employee data
         */
        self.destroyEmployee = function () {
            _destroyEmployeeCookies();
        };
        /**
         * check if current employee has permission to this menu item
         * @param menuItem
         * @return {boolean}
         */
        self.employeeHasPermissionTo = function (menuItem) {
            var item = permissionService.getMenuPermissions(menuItem);
            var method = item.type === 'item' ? 'hasThesePermissions' : 'hasAnyPermissions';
            if (!employee)
                return false;
            return employee[method](item.permissions);
        };
        /**
         * @description check if the given applicationUser or id is the current employee.
         * @param applicationUser
         */
        self.isCurrentEmployee = function (applicationUser) {
            var id = applicationUser.hasOwnProperty('id') ? applicationUser.id : applicationUser;
            return employee.id === id;
        };
        /**
         * set current Employee from Updated application User.
         * @param applicationUser
         */
        self.setCurrentEmployee = function (applicationUser) {
            var result = employee.getExtraFields();
            result.userInfo = applicationUser;
            _createEmployeeCookies(result);
        };
        /**
         * @description expose has permission to from Employee Model
         * @param permission
         * @returns {*}
         */
        self.hasPermissionTo = function (permission) {
            return employee ? employee.hasPermissionTo.apply(employee, arguments) : false;
        };
        /**
         * if the current employee is admin.
         * @returns {boolean}
         */
        self.isAdminUser = function () {
            return employee && employee.isAdmin;
        };

        self.isCloudUser = function () {
            return employee && employee.isCloudAdmin;
        };
        /**
         * @description if the current employee has proxy user.
         * @returns {*}
         */
        self.hasProxy = function () {
            return employee && employee.hasProxy();
        };
        /**
         * set rootEntity service.
         * @param entity
         */
        self.setRootEntityService = function (entity) {
            rootEntity = entity;
            return self;
        };
        /**
         * @description to check from employee service if the current logged in user in central archive or not.
         * @returns {*}
         */
        self.isCentralArchive = function () {
            return employee && employee.inCentralArchive();
        }


    });
};
