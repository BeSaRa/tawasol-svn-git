module.exports = function (app) {
    app.directive('popupToolbarDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('popup-toolbar-template.html'),
            replace: true,
            controller: 'popupToolbarDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                headerText: '@',
                showTooltip: '=',
                hideClose: '=?',
                closeCallback: '=?',
                fullScreenButton: '=?',
                fullScreen: '=?'
            }
        }
    })
};
