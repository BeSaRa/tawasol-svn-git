module.exports = function (app) {
    require('./reference-plan-element-directive-style.scss');
    app.directive('referencePlanElementDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('reference-plan-element-template.html'),
            scope: {
                referenceItem: '='
            },
            bindToController: true,
            controller: 'referencePlanElementDirectiveCtrl',
            controllerAs: 'ctrl'
        }
    })
};
