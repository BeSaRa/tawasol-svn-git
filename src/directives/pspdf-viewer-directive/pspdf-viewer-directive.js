module.exports = function (app) {
    app.directive('pspdfViewerDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'pspdfViewerDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('pspdf-viewer-directive-template.html'),
            scope: {
                docUrl: '=',
                excludedPermissions: '='
            },
            link: function (scope, element, attrs, ctrl) {
                scope.$on('$destroy', function () {
                    ctrl.destroyInstance();
                });
                scope.$watch(function () {
                    return ctrl.docUrl;
                }, function (newValue, oldValue) {
                    if (oldValue && newValue && oldValue.$$unwrapTrustedValue() !== newValue.$$unwrapTrustedValue()) {
                        ctrl.$onInit();
                    }
                });
            }
        }
    })
};
