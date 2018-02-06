module.exports = function (app) {
    require('./theme-preview-style.scss');
    app.directive('themePreviewDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./theme-preview-template.html'),
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