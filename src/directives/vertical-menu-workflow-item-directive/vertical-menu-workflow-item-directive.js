module.exports = function (app) {
    app.directive('verticalMenuWorkflowItemDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'verticalMenuWorkflowItemDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('vertical-menu-workflow-item-template.html'),
            scope: {
                item: '=',
                callback: '=',
                ignoreCallback: '=',
                display: '=',
                displayButton: '=',
                release: '=',
                gridName: '=',
                wfGroupCallback: '=?'
            }
        }
    })
};
