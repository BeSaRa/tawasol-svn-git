module.exports = function (app) {
    app.directive('viewDocumentInboxDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./view-document-inbox-template.html'),
            controller: 'viewDocumentInboxDirectiveCtrl',
            controllerAs: 'ctrl',
            replace: true,
            bindToController: true,
            scope: {
                url: '=',
                outgoing: '=',
                buttonsToShow: '='
            }
        }
    });
};