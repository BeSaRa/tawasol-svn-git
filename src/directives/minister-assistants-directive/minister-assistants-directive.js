module.exports = function (app) {
    app.directive('ministerAssistantsDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'ministerAssistantsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('minister-assistants-directive-template.html'),
            scope: {
                ministerAssistants: '='
            }
        }
    });
};
