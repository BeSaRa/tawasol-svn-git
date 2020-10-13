module.exports = function (app) {
    require('./sequential-workflow-steps-style.scss');
    app.directive('sequentialWorkflowStepsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            templateUrl: cmsTemplate.getDirective('sequential-workflow-steps-template.html'),
            controller: 'sequentialWorkflowStepsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                seqWF: '=',
                redrawSteps: '=',
                viewOnly: '=',
                correspondence: '=',
                isLaunchSeqWF: '=',
                usageType: '@'
            }
        }
    })
};
