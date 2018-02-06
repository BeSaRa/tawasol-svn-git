module.exports = function (app) {
    app.directive('accordionContent', function ($compile) {
        'ngInject';
        return {
            restrict: 'E',
            transclude: true,
            link: function (scope, element, attrs, ctrl, transclude) {
                element.replaceWith(angular.element('<md-content class="p20"></md-content>'));
                element.append($compile(transclude())(scope));
            }
        }
    })
};