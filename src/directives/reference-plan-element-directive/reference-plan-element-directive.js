module.exports = function (app) {
    require('./reference-plan-element-directive-style.scss');
    app.directive('referencePlanElementDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./reference-plan-element-template.html'),
            scope: {
                referenceItem: '='
            },
            bindToController: true,
            controller: 'referencePlanElementDirectiveCtrl',
            controllerAs: 'ctrl'
        }
    })
};