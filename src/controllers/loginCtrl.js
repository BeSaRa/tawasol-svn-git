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

        // self.rows = [
        //     {name: 'BeSaRa', age: 15, jobTitle: 'AngularJS Developer', active: true},
        //     {name: 'Sudir', age: 20, jobTitle: 'Web Developer', active: false},
        //     {name: 'Manish', age: 40, jobTitle: 'Web Developer', active: true},
        //     {name: 'Navjot', age: 13, jobTitle: 'Web Developer', active: false},
        //     {name: 'Mohamed', age: 78, jobTitle: 'Web Developer', active: false}
        // ];
        //
        // self.filter = {};
        //
        // var filter = new FilterFactory('filter');
        //
        // filter.setOptions(
        //     [
        //         filter.text('search by name', 'name'),
        //         filter.select('select age', 'age', [15, 20, 40, 13, 78]),
        //         filter.switch('select status', 'active', true, false)
        //     ]
        // );
        //
        // filter
        //     .openFilter()
        //     .then(function (result) {
        //
        //     });


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
                $state.go('app.landing-page', {identifier: rootEntity.getRootEntityIdentifier()});
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
                .catch(function () {
                    self.loginStatus = false;
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
                    template: cmsTemplate.getPopup('select-organization-login'),
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
                template: cmsTemplate.getPopup('terms'),
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
    });
};