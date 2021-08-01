module.exports = function (app) {
    app.directive('manageContentDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'manageContentDirectiveCtrl',
            controllerAs: 'ctrl',
            templateUrl: cmsTemplate.getDirective('manage-content-template.html'),
            bindToController: true,
            scope: {
                fromDialog: '=',
                editContent: '=',
                displayPrepare: '=',
                templates: '=',
                vsId: '=',
                documentClass: '=',
                document: '=?',
                documentInformation: '=',
                disableWhen: '=',
                signaturesCount: '=',
                simpleViewUrl: '=?',
                viewUrl: '=?',
                isSimpleAdd: '=?',
                receiveDocument: '=?',
                uploadedCallback: '=?'
            }
        }
    })
};
