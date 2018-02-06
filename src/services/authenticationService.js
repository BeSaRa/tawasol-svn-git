module.exports = function (app) {
    app.service('authenticationService', function ($http,
                                                   $cookies, 
                                                   lookupService, 
                                                   tokenService, 
                                                   employeeService, 
                                                   urlService, 
                                                   rootEntity, 
                                                   Credentials) {
        'ngInject';
        var self = this, cacheCredentials = new Credentials();
        self.logoutBySessionsKey = 'logoutSession';
        /**
         * this method to make authentication by given credentials
         * @param credentials
         */
        self.authenticate = function (credentials) {
            // check if the login came from inside application.
            if (credentials instanceof Credentials === false) {
                return;
            }
            // set current tawasol root entity identifier.
            credentials.setTawasolEntityId(rootEntity.getRootEntityIdentifier());
            cacheCredentials = credentials;
            // call backend service to login.
            return $http.post(urlService.login, credentials).then(function (result) {
                if (result.data.hasOwnProperty('rs') && result.data.rs.hasOwnProperty('token')) {
                    tokenService.setToken(result.data.rs.token);
                }

                if (!result.data.rs.hasOwnProperty('ouList')) {
                    lookupService.setLookups(result.data.rs.globalLookup);
                    if (!result.data.rs.isAdminUser)
                        self.setLastLoginOrganizationId(result.data.rs.ou);
                }
                return result.data.rs;
            });
        };
        /**
         * to select organization to login
         * @param organization
         */
        self.selectDepartmentToLogin = function (organization) {
            var employee = employeeService.getEmployee();
            cacheCredentials.setOuId(organization);
            // set current tawasol root entity identifier.
            cacheCredentials.setTawasolEntityId(rootEntity.getRootEntityIdentifier());
            cacheCredentials.setUserName(employee.domainName);
            // cacheCredentials.loginUsingDefaultOu = false;

            return $http.post(urlService.selectOrganizationLogin, cacheCredentials).then(function (result) {
                result = result.data.rs;
                self.setLastLoginOrganizationId(organization); // after login success
                lookupService.setLookups(result.globalLookup); // set global lookups
                tokenService.setToken(result.token);
                employeeService
                    .setEmployee(result);
                return result;
            });
        };
        /**
         * set last login organization cookies
         * @param organization
         */
        self.setLastLoginOrganizationId = function (organization) {
            var date = (new Date());
            date.setYear(date.getFullYear() + 1);
            $cookies.put(tokenService.getLastLoginOrganizationIdKey(), organization.ouid || organization.id, {
                expires: date
            });
        };
        /**
         * get last login organization from cookies
         * @returns {*|string}
         */
        self.getLastLoginOrganizationId = function () {
            return $cookies.get(tokenService.getLastLoginOrganizationIdKey());
        };
        /**
         * remove last login organization id
         */
        self.removeLastLoginOrganizationId = function () {
            $cookies.remove(tokenService.getLastLoginOrganizationIdKey());
        };
        /**
         * logout from application and destroy current session.
         */
        self.logout = function () {
            return $http.post(urlService.logout, null)
                .then(function (result) {
                    tokenService.destroy(); // destroy the current sessions
                    employeeService.destroyEmployee(); // destroy current user data
                    return result.data.rs;
                })
                .catch(function () {
                    tokenService.destroy(); // destroy the current sessions
                    employeeService.destroyEmployee(); // destroy current user data
                    return true;
                });
        }

        /*
         if user remove last login organization from cookies still he can login if has the token
         TODO : we need to prevent the user from complete the session if last login id removed discuss with the backend-team
         */
    });
};