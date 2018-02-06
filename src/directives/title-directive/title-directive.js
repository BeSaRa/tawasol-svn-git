module.exports = function (app) {
    app.directive('titleDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            bindToController: true,
            controller: 'titleDirectiveCtrl',
            controllerAs: 'titleCtrl'
        }
    })
};