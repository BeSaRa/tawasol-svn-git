module.exports = function (app) {
    app.directive('viewDocumentQueueDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./view-document-queue-template.html'),
            controller: 'viewDocumentQueueDirectiveCtrl',
            controllerAs: 'ctrl',
            replace: true,
            bindToController: true,
            scope: {
                outgoing: '=',
                buttonsToShow: '=',
                url: '='
            }
        }
    });
};