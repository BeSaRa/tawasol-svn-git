module.exports = function (app) {
    app.directive('simpleForwardDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('simple-forward-template.html'),
            controller: 'simpleForwardDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                correspondence: '=',
                workItem:'=',
                comments: '=',
                favoriteUsers: '=',
                favoriteWorkFlowActions: '='
            }
        }
    });
};
