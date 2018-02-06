module.exports = function (app) {
    require('./css/accordion-style.scss');
    app.directive('accordionDirective', function ($parse) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'accordionDirectiveCtrl',
            bindToController: true,
            controllerAs: 'accordionCtrl',
            link: function (scope, element, attrs) {
                scope.$watch(attrs.validation, function (newVal) {
                    element.toggleClass('validation', newVal);
                });
                scope.$watch(attrs.labelCollapse, function (value) {
                    element.data('labelCollapse', value);
                });
            }
        }
    })
};