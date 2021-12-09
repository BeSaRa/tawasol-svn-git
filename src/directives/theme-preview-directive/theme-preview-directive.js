module.exports = function (app) {
    require('./theme-preview-style.scss');
    app.directive('themePreviewDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('theme-preview-template.html'),
            replace: true,
            controller: 'themePreviewDirectiveCtrl',
            bindToController: true,
            controllerAs: 'ctrl',
            scope: {
                theme: '=',
                clickAble: '=',
                selected: '='
            }
        }
    })
};
