module.exports = function (app) {
    app.directive('manageLinkedDocumentDirective', function ($interval,cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-linked-document-template.html'),
            controller: 'manageLinkedDocumentDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                linkedDocs: '=',
                documentClass: '=',
                vsId: '=',
                disableEverything: '=?'
            },
            link: function ($scope) {

            }
        }
    });
};
