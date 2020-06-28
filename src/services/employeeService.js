module.exports = function (app) {
    app.service('employeeService', function ($cookies,
                                             Employee,
                                             CMSModelInterceptor,
                                             lookupService,
                                             generator,
                                             $timeout,
                                             permissionService) {
        'ngInject';
        var self = this, employee = null,
            employeeCookiesKey = 'CMSEmployee', rootEntity, langService, applicationUserSignatureService;

        self.serviceName = 'employeeService';

        var classMapPermission = {
            outgoing: {
                properties: 'EDIT_OUTGOING_PROPERTIES',
                content: function (isPaper) {
                    return isPaper ? 'EDIT_OUTGOING_PAPER' : 'EDIT_OUTGOING_CONTENT';
                }
            },
            incoming: {
                properties: 'EDIT_INCOMING’S_PROPERTIES',
                content: 'EDIT_INCOMING’S_CONTENT'
            },
            internal: {
                properties: 'EDIT_INTERNAL_PROPERTIES',
                content: 'EDIT_INTERNAL_CONTENT'
            }
        };

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
                    isCloudAdmin: result.isCloudAdmin,
                    isSuperAdmin: result.isSuperAdmin,
                    isSubAdmin: result.isSubAdmin,
                    mappedToCentralArchive: result.mappedToCentralArchive
                });
                if (result.isAdminUser) {
                    employee.setPermissions(result.permissions); // set permissions
                    return self;
                }
            } else {
                employee = generator.interceptReceivedInstance('ApplicationUser', new Employee(result.userInfo));
                employee.isCloudAdmin = result.isCloudAdmin;
                employee.isSuperAdmin = result.isSuperAdmin;
                employee.isSubAdmin = result.isSubAdmin;
                employee.isAdmin = result.isAdminUser;
                employee.mappedToCentralArchive = result.mappedToCentralArchive;
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
            //employee.loadOrganization();
            employee.updateUserOrganizationInfo(result.ouInfo);
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
            applicationUserSignatureService ? applicationUserSignatureService.emptySignatures() : null;
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
            if (!employee) {
                return false;
            }
            var id = applicationUser.hasOwnProperty('id') ? applicationUser.id : applicationUser;
            return employee.id === id;
        };
        /**
         * @default to check if the given ouApplicationUser same current ouApplicationUser.
         * @param ouApplicationUser
         * @return {boolean}
         */
        self.isCurrentOUApplicationUser = function (ouApplicationUser) {
            // cladmin user
            if (!employee.organization)
                return false;
            var ouAppUserOuId = ouApplicationUser.ouid.hasOwnProperty('id') ? ouApplicationUser.ouid.id : ouApplicationUser.ouid;
            var userId = ouApplicationUser.applicationUser.hasOwnProperty('id') ? ouApplicationUser.applicationUser.id : ouApplicationUser.applicationUser;
            var employeeOuId = (employee.organization.ouid && employee.organization.ouid.hasOwnProperty('id')) ? employee.organization.ouid.id : employee.organization.ouid;
            return employee.id === userId && employeeOuId === ouAppUserOuId;
        };
        /**
         * @default to check if the given applicationUser same current employee.
         * @param applicationUser
         * @return {boolean}
         */
        self.isCurrentApplicationUser = function (applicationUser) {
            // cladmin user
            if (!employee || !employee.organization)
                return false;

            return employee.id === generator.getNormalizedValue(applicationUser, 'id');
        };
        /**
         * @description set current Employee from Updated application User.
         * @param applicationUser
         */
        self.setCurrentEmployee = function (applicationUser) {
            var result = employee.getExtraFields();
            result.userInfo = applicationUser;
            result.propertyConfiguration = angular.copy(lookupService.getAllPropertyConfigurations());
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
         * @description Checks if the current employee is admin.
         * @returns {boolean}
         */
        self.isAdminUser = function () {
            return employee && employee.isAdmin;
        };

        /**
         * @description Checks if the current employee is cloud-admin.
         * @returns {boolean}
         */
        self.isCloudUser = function () {
            return employee && employee.isCloudAdmin;
        };

        /**
         * @description Checks if the current employee is super-admin.
         * @returns {boolean}
         */
        self.isSuperAdminUser = function () {
            return employee && employee.isSuperAdmin;
        };

        /**
         * @description Checks if the current employee is sub-admin.
         * @returns {boolean}
         */
        self.isSubAdminUser = function () {
            return employee && employee.isSubAdmin;
        };

        /**
         * @description Checks if the current employee is clAdmin (default first application user).
         * @returns {boolean}
         */
        self.isClAdmin = function () {
            if (!employee) {
                return false;
            }
            return !employee.organization || !employee.organization.hasOwnProperty('ouid') || employee.organization.ouid === -1;
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
        };
        self.isCentralArchiveHasNotRegistry = function () {
            return employee && employee.inCentralArchiveAndNotHasRegistry();
        };
        self.isCentralArchiveHasRegistry = function () {
            return employee && employee.inCentralArchiveAndHasRegistry();
        };

        self.isCurrentOuLinkedToArchive = function () {
            return employee && employee.mappedToCentralArchive;
        };

        self.setSignatureService = function (service) {
            applicationUserSignatureService = service;
        };

        self.getPermissionForDocumentClass = function (document) {
            var info = document.getInfo(),
                permissionName = angular.copy(classMapPermission[info.documentClass.toLowerCase()]);

            if (typeof permissionName.content === 'function') {
                permissionName.content = permissionName.content(info.isPaper);
            }
            return permissionName;
        };

        self.employeePermissionChanged = function (callback) {
            return employee ? employee.listeningToPermissionsChanges(callback) : null;
        };

        $timeout(function () {
            CMSModelInterceptor.runEvent('employeeService', 'init', self);
        }, 100);

    });
};
