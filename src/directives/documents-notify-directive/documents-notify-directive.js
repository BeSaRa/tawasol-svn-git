module.exports = function (app) {
    require('./document-notify-style.scss');
    app.directive('documentsNotifyDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'documentsNotifyDirectiveCtrl',
            controllerAs: 'ctrl',
            replace: true,
            scope: {},
            template: require('./documents-notify-template.html')
        }
    })
};