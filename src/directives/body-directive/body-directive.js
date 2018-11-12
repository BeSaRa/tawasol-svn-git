module.exports = function (app) {
    app.directive('bodyDirective', function ($compile, stateHelperService, toast, $window) {
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

            }
        }
    })
};