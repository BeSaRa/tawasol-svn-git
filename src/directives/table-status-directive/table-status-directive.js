module.exports = function (app) {
    app.directive('tableStatusDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./table-status-template.html'),
            controller: 'tableStatusDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                whenClose: '='
            }
        }
    })
};