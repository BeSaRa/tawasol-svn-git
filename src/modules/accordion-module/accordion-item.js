module.exports = function (app) {
    app.directive('accordionItem', function ($timeout) {
        'ngInject';
        return {
            restrict: 'E',
            require: '^accordionDirective',
            scope: true,
            link: function (scope, element, attrs, ctrl) {
                attrs.$observe('active', function (interpolatedValue) {
                    element.toggleClass('active', interpolatedValue);
                });
                scope.$watch(attrs.passWhen, function (newVal) {
                    if (newVal) {
                        element.addClass('pass-validation');
                    } else {
                        element.removeClass('pass-validation');
                    }
                });
                scope.$watch(attrs.failWhen, function (newVal) {
                    if (newVal) {
                        element.addClass('fail-validation');
                    } else {
                        element.removeClass('fail-validation');
                    }
                });
            }
        }
    })
};