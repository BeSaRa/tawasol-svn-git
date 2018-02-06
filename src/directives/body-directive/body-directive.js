module.exports = function (app) {
    app.directive('bodyDirective', function ($compile, stateHelperService) {
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
                }).html('{{"version :" + bundleVersion}}');
                element.append($compile(div)(scope));
            }
        }
    })
};