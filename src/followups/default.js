module.exports = function (app) {
    app.run(function (application,
                      rootEntity,
                      employeeService,
                      $stateParams,
                      loginDialogService,
                      reportService,
                      loadingIndicatorService,
                      stateHelperService,
                      $transitions,
                      $timeout,
                      errorCode,
                      $state,
                      $q,
                      $location,
                      authenticationService,
                      urlService,
                      $rootScope,
                      Idle,
                      viewDocumentService,
                      exception,
                      // $templateRequest,
                      dialog,
                      $cookies,
                      localStorageService,
                      tokenService,
                      langService) {
        'ngInject';
        // start watching when the app runs. also starts the Keepalive service by default.
        // Idle.watch();

        exception.addGeneralExceptionHandler(401, function (xhr) {
            var url = xhr.config.url;

            /*
            if (url === urlService.login && xhr.hasOwnProperty('data') && xhr.data.hasOwnProperty('ec') && xhr.data.ec === 9017) {
                return;
            }
            */

            if (url === urlService.login) {
                errorCode.showErrorDialog(xhr);
            } else {
                if (xhr.data.ec === 9002 && localStorageService.get('CR')) {
                    localStorageService.remove('CR');
                    tokenService.destroy(); // destroy the current sessions
                    employeeService.destroyEmployee(); // destroy current user data
                    loadingIndicatorService.forceEndLoading();
                    if ($cookies.get(authenticationService.logoutBySessionsKey) !== 'true') {
                        dialog.alertMessage(langService.get('session_expired_login_again'));
                    }
                    $state.go('login', {identifier: rootEntity.getRootEntityIdentifier()});
                } else {
                    loadingIndicatorService.forceEndLoading();
                }
            }
        });

        exception.addGeneralExceptionHandler(500, function (xhr) {
            var url = xhr.config.url;
            if (url === urlService.login) {
                errorCode.showErrorDialog(xhr);
            } else {
                if (errorCode.hasErrorCode(xhr)) {
                    errorCode.showErrorDialog(xhr);
                } else if ((xhr.config.method !== 'DELETE')) {
                    dialog
                        .errorMessage(langService.get('internal_server_error'));
                }
            }
        });

        exception.addGeneralExceptionHandler(500, function (xhr) {
            var ec = xhr.data.ec;
            if (ec === 1005 && xhr.config.method === 'DELETE')
                dialog.errorMessage(langService.get('record_has_related_records'));

        });

        $transitions.onStart({}, function (transition) {
            var stateName = transition.to().name;
            if (!application.isReadyStatus() && stateName !== 'loading' && stateName !== 'password') {
                var path = $location.path();
                if (path.indexOf('view-external-doc') > -1) {
                    application.setUrl($location.url());
                    //return transition.router.stateService.target('view-external-doc');
                } else {
                    var identifier = transition.injector().get('$stateParams').identifier;
                    if (path.indexOf('404') === -1 && path.indexOf('access-denied') === -1) {
                        application.setUrl($location.url());
                    }
                    return transition.router.stateService.target('loading', {identifier: identifier});
                }
            }
        });

        $transitions.onStart({to: '**'}, function (transition) {
            var identifier, $cookies = transition.injector().get('$cookies');

            try {
                identifier = $location.path().match(/\entity\/(.[^\/]*)/)[1];
            } catch (e) {
                identifier = false;
            }

            if (identifier === false)
                return true;

            return rootEntity
                .needToLoadInformation(identifier)
                .then(function () {
                    return true;
                })
                .catch(function (rootEntityIdentifier) {
                    return authenticationService
                        .logout()
                        .then(function () {
                            return rootEntity
                                .loadInformation(rootEntityIdentifier)
                                .catch(function (error) {
                                    $rootScope.lang = langService.getCurrentTranslate();
                                    return errorCode.checkIf(error, 'ROOT_ENTITY_NOT_FOUND', function () {
                                        dialog.errorMessage(langService.get('root_entity_not_found'));
                                        return $q.reject();
                                    });
                                })
                        });
                });
        });

        $transitions.onStart({to: 'app.**'}, function (transition) {
            var spinnerService = transition.injector().get('loadingIndicatorService');
            var tokenService = transition.injector().get('tokenService');
            var loginDialogService = transition.injector().get('loginDialogService');

            spinnerService.startLoading();
            transition.promise.finally(spinnerService.endLoading);
            return tokenService
                .tokenRefresh()
                .then(function () {
                    return true;
                    // return loginDialogService
                    //     .openLoginDialog(true);
                })
                .catch(function () {
                    return loginDialogService
                        .openLoginDialog(true);
                });
        });


        $transitions.onEnter({to: 'app.landing-page'}, function (transition) {
            return $timeout(function () {
                if (transition.to().name === 'app.landing-page' && employeeService.isAdminUser()) {
                    return $state.target('app.administration.entities', {identifier: transition.injector().get('$stateParams').identifier});
                }
                return true;
            }, 100).catch(angular.noop);
        });

        $transitions.onEnter({to: 'app.**'}, function (transition) {
            var permission = transition.to().permission,
                params = transition.injector().get('$stateParams'),
                sidebarService = transition.injector().get('sidebarService'),
                isDynamic = transition.to().isDynamic,
                // report = isReport ? reportService.getReportByReportName(params.reportName) : false;
                menuItem = (isDynamic) ? sidebarService.getDynamicMenuItemByID(params.menuId) : false;

            // if (isReport && report) {
            //     permission = report.langKey;
            // }
            // TODO: to be refactor.
            if (isDynamic) {
                permission = menuItem ? false : 'PERMISSION_' + Math.random() + '_PERMISSION';
                if (permission && !employeeService.hasPermissionTo(permission)) {
                    return transition.router.stateService.target('app.access-denied', params);
                }
            }

            if (!permission)
                return;

            if (employeeService && !employeeService.employeeHasPermissionTo(permission)) {
                // redirect to the 'access-denied' state
                return transition.router.stateService.target('app.access-denied', params);
            }
        })

    });
};
