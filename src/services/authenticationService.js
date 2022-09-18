module.exports = function (app) {
    app.service('authenticationService', function ($http,
                                                   $cookies,
                                                   cmsTemplate,
                                                   lookupService,
                                                   tokenService,
                                                   employeeService,
                                                   localStorageService,
                                                   GlobalSetting,
                                                   urlService,
                                                   rootEntity,
                                                   generator,
                                                   Credentials,
                                                   titleService,
                                                   gridService,
                                                   encryptionService,
                                                   $q,
                                                   toast,
                                                   errorCode,
                                                   dialog,
                                                   langService) {
        'ngInject';
        var self = this, cacheCredentials = new Credentials();
        self.logoutBySessionsKey = 'logoutSession';

        function _saveToStorage(credentials) {
            var c = angular.copy(credentials);
            delete c.ouId;
            localStorageService.set('CR', encryptionService.encrypt(JSON.stringify(credentials)));
        }

        function _getFromStorage() {
            return JSON.parse(encryptionService.decrypt(localStorageService.get('CR')));
        }

        function _completeAuthenticationProcess(result, credentials) {
            titleService.setTitle(rootEntity.returnRootEntity().getTranslatedAppName());
            _saveToStorage(credentials);
            gridService.removeAllSorting();
            if (result.data.hasOwnProperty('rs') && result.data.rs.hasOwnProperty('token')) {
                tokenService.setToken(result.data.rs.token);
            }

            lookupService.setLookups(result.data.rs.globalLookup);

            rootEntity.setRootEntityGlobalSetting(result.data.rs.globalSetting, true);
            rootEntity.returnRootEntity().updateRootEntity(result.data.rs.tawasolEntity);
            rootEntity.setCountryVersion(result.data.rs.versionCountry);
            if (!result.data.rs.isAdminUser) {
                self.setLastLoginOrganizationId(result.data.rs.ou);
            }
            return result.data.rs;
        }

        function _openOTPDialog(result, credentials) {
            var referenceOTP = result.data.rs;
            var cachedCredentials = angular.copy(credentials);
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('otp-login'),
                locals: {
                    referenceOTP: referenceOTP
                },
                controller: function (referenceOTP) {
                    'ngInject';
                    var ctrl = this;
                    ctrl.otp = null;
                    ctrl.referenceOTP = referenceOTP;
                    ctrl.inProgress = false;

                    ctrl.completeLogin = function () {
                        ctrl.inProgress = true;
                        cachedCredentials.password = encryptionService.decrypt(credentials.password);
                        self.authenticate(cachedCredentials, {otp: ctrl.otp, otpReference: ctrl.referenceOTP})
                            .then(function (result) {
                                dialog.hide(result);
                            })
                            .catch(function (error) {
                                ctrl.inProgress = false;
                                toast.error(error.data.eo[langService.current + 'Name']);
                            });
                    }
                },
                controllerAs: 'ctrl'
            });
        }

        /**
         * this method to make authentication by given credentials
         * @param credentials
         * @param reference
         */
        self.authenticate = function (credentials, reference) {
            // check if the login came from inside application.
            if (credentials instanceof Credentials === false) {
                return;
            }
            // set current tawasol root entity identifier.
            credentials.setTawasolEntityId(rootEntity.getRootEntityIdentifier());
            cacheCredentials = angular.copy(credentials);
            // call backend service to login.
            cacheCredentials.password = encryptionService.encrypt(cacheCredentials.password);

            if (reference) {
                cacheCredentials.otp = reference.otp;
                cacheCredentials.otpReference = reference.otpReference;
            }

            return $http.post(urlService.login, cacheCredentials, {
                params: {
                    withEncryption: true
                }
            }).then(function (result) {
                if (typeof result.data.rs === 'string') {
                    return _openOTPDialog(result, angular.copy(cacheCredentials));
                } else {
                    return _completeAuthenticationProcess(result, credentials);
                }
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
            cacheCredentials.password = null;
            return $http.post(urlService.selectOrganizationLogin, cacheCredentials).then(function (result) {
                result = result.data.rs;
                self.setLastLoginOrganizationId(organization); // after login success
                lookupService.setLookups(result.globalLookup); // set global lookups
                employeeService
                    .setEmployee(result);
                tokenService.setToken(result.token);
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
            localStorageService.remove('CR');
            var entity = rootEntity.returnRootEntity();
            return $http.post(urlService.logout, null)
                .then(function (result) {
                    if (entity) {
                        entity.checkSSO().then(function () {
                            $cookies.put('SSO_LOGGED_OUT', true);
                        });
                    }
                    tokenService.destroy(); // destroy the current sessions
                    employeeService.destroyEmployee(); // destroy current user data
                    return result.data.rs;
                })
                .catch(function () {
                    if (entity) {
                        entity.checkSSO().then(function () {
                            $cookies.put('SSO_LOGGED_OUT', true);
                        });
                    }
                    tokenService.destroy(); // destroy the current sessions
                    employeeService.destroyEmployee(); // destroy current user data
                    return true;
                });
        };

        self.getUserData = function () {
            return _getFromStorage();
        }

        /*
         if user remove last login organization from cookies still he can login if has the token
         TODO : we need to prevent the user from complete the session if last login id removed discuss with the backend-team
         */
    });
};
