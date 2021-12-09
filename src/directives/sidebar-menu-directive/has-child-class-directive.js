module.exports = function (app) {
    app.directive('hasChild', function () {
        'ngInject';
        return {
            restrict: 'C',
            link: function (scope, element) {
                console.log(element);
            }
        }
    });
};