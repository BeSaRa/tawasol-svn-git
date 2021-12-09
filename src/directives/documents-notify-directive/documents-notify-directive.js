module.exports = function (app) {
    require('./document-notify-style.scss');
    app.directive('documentsNotifyDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'documentsNotifyDirectiveCtrl',
            controllerAs: 'ctrl',
            replace: true,
            scope: {},
            templateUrl: cmsTemplate.getDirective('documents-notify-template.html')
        }
    })
};
