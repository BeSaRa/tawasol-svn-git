module.exports = function (app) {
    app.controller('loginCtrl', function (loginPage,
                                          cmsTemplate,
                                          $scope,
                                          employeeService,
                                          dialog,
                                          FilterFactory,
                                          $state,
                                          $stateParams,
                                          $q,
                                          $timeout,
                                          _,
                                          Idle,
                                          errorCode,
                                          rootEntity,
                                          themeService,
                                          $sce,
                                          $location,
                                          $cookies,
                                          generator,
                                          Credentials,
                                          OrganizationLogin,
                                          langService,
                                          publicAnnouncementService,
                                          privateAnnouncementService,
                                          authenticationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'loginCtrl';
        self.flipBg = loginPage.flip;
        self.loginStatus = false;


        self.credentials = new Credentials({
            username: '',
            password: '',
            tawasolEntityId: null
        });
        // to get the current root entity information which loaded already from backend in the
        self.rootEntity = rootEntity.returnRootEntity();
        // public announcements
        self.publicAnnouncements = rootEntity.returnPublicAnnouncements();
        // global announcements
        self.globalAnnouncements = rootEntity.returnGlobalAnnouncements();
        // concat public and global announcements
        self.announcements = self.publicAnnouncements.concat(self.globalAnnouncements);

        function checkIfLogoutBySession() {
            if ($cookies.get(authenticationService.logoutBySessionsKey)) {
                $cookies.remove(authenticationService.logoutBySessionsKey);

                dialog
                    .infoMessage(langService.get('you_are_logged_out_by_session'))
                    .then(function () {
                        //Idle.watch();
                    })
            }
        }

        /**
         * set Employee and permission to employee service.
         * @param result
         * @private
         */
        function _setEmployeeWithPermissions(result) {
            employeeService
                .setEmployee(result);
        }

        function _redirect() {
            if (!employeeService.isAdminUser()) {
                if (employeeService.hasPermissionTo('LANDING_PAGE'))
                    $state.go('app.landing-page', {identifier: rootEntity.getRootEntityIdentifier()});
                else
                    $state.go('app.inbox.user-inbox', {identifier: rootEntity.getRootEntityIdentifier()});
            } else {
                $state.go('app.administration.entities', {identifier: rootEntity.getRootEntityIdentifier()});
            }
        }


        function _completeLogin(callback, result) {
            var promise = $q.defer(), themeId;
            if (!result.isAdminUser) {
                themeId = result.userInfo.defaultThemeID;
                // to make some delay for the promise.
                $timeout(function () {
                    if (!themeId) {
                        promise.resolve(true);
                        return;
                    }
                    themeService.loadThemeById(themeId).then(function (theme) {
                        themeService.setCurrentTheme(theme);
                        promise.resolve(true);
                    }, function () {
                        promise.resolve(true);
                    });
                });
            } else if (result.isCloudAdmin) {
                $timeout(function () {
                    promise.resolve(true);
                });
            } else {
                $timeout(function () {
                    if (result.globalSetting)
                        themeService.setCurrentTheme(result.globalSetting.theme);
                    promise.resolve(true);
                });
            }

            // when resolve the promise complete the login.
            promise.promise.then(function () {
                _setEmployeeWithPermissions(result); // set employee
                $timeout(function () {
                    _showPrivateAnnouncements();
                }, 3000);

                if (!callback) {
                    _redirect();
                } else {
                    callback();
                }
            });
        }

        /**
         * login method
         * @param event
         * @param callback
         */
        self.login = function (event, callback) {
            self.loginStatus = true;
            authenticationService
                .authenticate(self.credentials)
                .then(function (result) {
                    _hideFixOverlay();
                    _completeLogin(callback, result);
                })
                .catch(function (error) {
                    self.loginStatus = false;
                    // wrong password or empty password
                    /*errorCode.checkIf(error, 'PASSWORD_EMPTY', function () {
                        dialog.errorMessage(langService.get('access_denied'));
                    });*/
                    return $q.reject(false);
                });
        };
        /**
         * select organization method if user has more then one organization
         * @param result
         * @param event
         * @param callback
         */
        self.selectOrganizationToLogin = function (result, event, callback) {
            dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('select-organization-login'),
                    targetEvent: event,
                    bindToController: true,
                    multiple: true,
                    // BeSaRa: i made it here because it is small ctrl .
                    controller: function ($mdDialog) {
                        'ngInject';
                        var ctrl = this;
                        ctrl.selectOrganization = function (organization) {
                            $mdDialog.hide(organization);
                        }

                    },
                    controllerAs: 'ctrl',
                    locals: {
                        organizations: result.ouList
                    }
                })
                .then(function (organization) {
                    authenticationService
                        .selectDepartmentToLogin(organization)
                        .then(function (result) {
                            if (result.hasOwnProperty('globalSetting')) {
                                _completeLogin(callback, result);
                            }
                        });
                });
        };

        function _fixLoginOverlay() {
            $scope.hasOwnProperty('_loginDialog') && $scope._loginDialog ? angular.element('body').addClass('login-dialog') : null;
        }

        function _hideFixOverlay() {
            angular.element('body').removeClass('login-dialog');
        }

        checkIfLogoutBySession();
        _fixLoginOverlay();

        self.showTerms = function ($event) {
            dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('terms'),
                escToCancel: true,
                targetEvent: $event,
                bindToController: true,
                controller: function ($sce) {
                    'ngInject';
                    var self = this;
                    self.close = function () {
                        dialog.cancel();
                    };
                },
                controllerAs: 'ctrl',
                locals: {
                    termsAndConditions: $sce.trustAsHtml(rootEntity.getGlobalSettings().tamcontent)
                }
            });
        };


        self.showHelp = function ($event) {
            dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('help'),
                escToCancel: true,
                targetEvent: $event,
                bindToController: true,
                controller: function (rootEntity, $sce, dialog) {
                    'ngInject';
                    var self = this;
                    self.globalSettings = rootEntity.getGlobalSettings();
                    self.helpUrl = rootEntity.returnRootEntity().rootEntity.helpUrl;
                    self.helpUrl = self.helpUrl ? $sce.trustAsResourceUrl(self.helpUrl) : false;
                    self.close = function () {
                        dialog.cancel();
                    };
                },
                controllerAs: 'ctrl'
            });
        };

        self.isHelpAvailable = function () {
            var globalSettings = rootEntity.getGlobalSettings();
            return !!globalSettings.supportEmail || !!globalSettings.supportPhoneNo || !!globalSettings.loginAdditionalContent;
        };


        /**
         * @description open popup to show private announcements, if not available then show alert
         * @param $event
         */
        var _showPrivateAnnouncements = function ($event) {
            if (privateAnnouncementService.count === 0) {
                return;
            }

            dialog
                .showDialog({
                    targetEvent: $event || null,
                    templateUrl: cmsTemplate.getPopup('show-private-announcement'),
                    controller: 'showPrivateAnnouncementPopCtrl',
                    controllerAs: 'ctrl',
                    resolve: {
                        privateAnnouncements: function () {
                            'ngInject';
                            return privateAnnouncementService.getPrivateAnnouncementByOUID().then(function (result) {
                                self.countPrivateAnnouncements = result.length;
                                return result;
                            });
                        }
                    }
                });
        };
    });
};
