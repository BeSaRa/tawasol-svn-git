module.exports = function (app) {
    app.directive('bodyDirective', function ($compile, tokenService, cacheService, stateHelperService, toast, $window) {
        'ngInject';
        return {
            restrict: 'A',
            controller: 'bodyDirectiveCtrl',
            controllerAs: 'body',
            bindToController: true,
            link: function (scope, element) {
                stateHelperService.getUpdatedStates();
                var div = angular.element('<div />', {
                    class: 'bundle-version',
                    layout: 'row',
                    'layout-align': 'center center'
                }).html('{{"version: " + bundleVersion}} - {{buildNumber}}');
                element.append($compile(div)(scope));

                app.refreshServerCache = function(skipReload){
                    if (tokenService.getToken()) {
                        cacheService.refreshCache()
                            .then(function () {
                                if (!skipReload){
                                    $window.location.reload();
                                }
                            });
                    }
                };

                angular
                    .element($window)
                    .on('keydown', function (e) {
                        var code = e.which || e.keyCode;

                        if (e.altKey && e.ctrlKey && e.shiftKey && code === 67 && tokenService.getToken()) {
                            e.preventDefault();
                            cacheService.refreshCache();
                        }
                    });
            }
        }
    })
};
