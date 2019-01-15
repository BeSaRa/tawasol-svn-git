module.exports = function (app) {
    app.directive('filterLabelDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'filterLabelDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            templateUrl: cmsTemplate.getDirective('filter-label-template.html'),
            scope: {
                userFilterEdit: '=',
                userFilterDelete: '=',
                filter: '='
            }
        }
    })
};
