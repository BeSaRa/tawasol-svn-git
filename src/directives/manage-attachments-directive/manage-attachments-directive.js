module.exports = function (app) {
    require('./manage-attachment-style.scss');
    app.directive('manageAttachmentDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-attachments-template.html'),
            controller: 'manageAttachmentDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                document: '=',
                attachments: '=',
                vsId: '=?',
                documentClass: '=',
                sourceModel: '=',
                fromDialog: '=?',
                allowScanner: '=?',
                allowUpload: '=?',
                displayGrid: '=?',
                disableEverything: '=?',
                linkedExportedAttachments: '=?'
            }
        }
    });
};
