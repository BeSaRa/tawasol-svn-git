module.exports = function (app) {
    app.directive('filterLabelDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'filterLabelDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            template: require('./filter-label-template.html'),
            scope: {
                userFilterEdit: '=',
                userFilterDelete: '=',
                filter: '='
            }
        }
    })
};