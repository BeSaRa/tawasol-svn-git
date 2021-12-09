module.exports = function (app) {
    app.directive('generateRemainingSearchDivDirective', function ($timeout) {
        'ngInject';
        return {
            restrict: 'M',
            priority: 100,
            scope: {},
            link: function (scope, element) {
                $timeout(function () {
                    var parent = angular.element(element).parent();
                    var needs = 4 - parent.children('div').length;
                    createRemainingRows(needs, parent);
                }, 1000);

                function createRemainingRows(number, parent) {
                    while (number > 0) {
                        parent.append(angular.element('<div></div>').addClass('layout-row flex'));
                        number--;
                    }
                }
            }
        }
    })
};