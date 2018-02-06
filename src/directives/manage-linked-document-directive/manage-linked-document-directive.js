module.exports = function (app) {
    app.directive('manageLinkedDocumentDirective', function ($interval) {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-linked-document-template.html'),
            controller: 'manageLinkedDocumentDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                linkedDocs: '=',
                documentClass: '=',
                vsId: '='
            },
            link: function ($scope) {

            }
        }
    });
};