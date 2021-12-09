module.exports = function (app) {
    app.directive('bulkCorrespondenceStatusDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'bulkCorrespondenceStatusDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('bulk-correspondence-status-template.html'),
            scope: {
                items: '=',
                deleteCallback: '='
            }
        }
    })
};
