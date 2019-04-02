module.exports = function (app) {
    app.directive('cmsVirtualRepeater', function () {
        'ngInject';
        return {
            restrict: 'C',
            link: function(scope, elem, attr) {
                var element = angular.element(elem);
                console.log('element', element);
            }
        }
    })
};
