module.exports = function (app) {
    app.run(function (application,
                      rootEntity,
                      employeeService,
                      $stateParams,
                      loginDialogService,
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
                      exception,
                      dialog,
                      langService) {
        'ngInject';
        // start watching when the app runs. also starts the Keepalive service by default.
        Idle.watch();

        exception.addGeneralExceptionHandler(401, function (xhr) {
            var url = xhr.config.url;
            if (url === urlService.login) {
                dialog
                    .errorMessage(langService.get('access_denied'))
            } else {
                return loginDialogService
                    .displaySessionMessage();
            }
        });

        exception.addGeneralExceptionHandler(500, function (xhr) {
            var url = xhr.config.url;
            if (url === urlService.login) {
                dialog
                    .errorMessage(langService.get('internal_server_error'))
            }
        });

        exception.addGeneralExceptionHandler(500, function (xhr) {
            var errorCode = xhr.data.ec;
            if (errorCode === 1005 && xhr.config.method === 'DELETE')
                dialog.errorMessage(langService.get('record_has_related_records'));

        });

        $transitions.onStart({}, function (transition) {
            if (!application.isReadyStatus() && transition.to().name !== 'loading') {
                var Identifier = transition.injector().get('$stateParams').identifier;
                if ($location.path().indexOf('404') === -1) {
                    application.setUrl($location.path());
                }
                return transition.router.stateService.target('loading', {identifier: Identifier});
            }
        });

        $transitions.onStart({to: '**'}, function () {
            var identifier;
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
                    /*return langService
                        .getLanguages()
                        .then(function (lang) {
                            $rootScope.lang = lang;*/
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
                    // });
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

    });
};