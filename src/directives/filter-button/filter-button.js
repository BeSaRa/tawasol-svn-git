module.exports = function (app) {
    app.directive('filterButton', function () {
        'ngInject';
        return {
            restrict: 'C',
            link: function (scope, element) {
                angular.element(element).on('click', function ($event) {
                    $event.stopPropagation();
                })
            }
        }
    })
};