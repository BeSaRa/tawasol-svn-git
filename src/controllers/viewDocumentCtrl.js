module.exports = function (app) {
    app.controller('viewDocumentCtrl', function (viewDocumentService,
                                                 classifications,
                                                 outgoingService,
                                                 documentTypes,
                                                 documentFiles,
                                                 managerService,
                                                 documentFileService,
                                                 documentTypeService,
                                                 validationService,
                                                 langService,
                                                 toast,
                                                 employeeService,
                                                 $timeout,
                                                 lookupService,
                                                 demoOutgoing,
                                                 organizations) {
        'ngInject';
        var self = this;

        self.controllerName = 'viewDocumentCtrl';
        self.openDocumentPopup = function ($event) {
            viewDocumentService
                .openDocumentPopup(true,
                    classifications,
                    outgoingService,
                    documentTypes,
                    documentFiles,
                    managerService,
                    documentFileService,
                    documentTypeService,
                    validationService,
                    langService,
                    toast,
                    employeeService,
                    $timeout,
                    lookupService,
                    demoOutgoing,
                    organizations, $event);
        };
        /*self.document = {
         'content': './assets/images/document.jpg',
         'author': 'A.Smith',
         'sender': 'Another',
         'due': '20/05/17',
         'received': '10/05/17',
         'serial': '134567892',
         'description': 'This report covers our findings based on the research that we conducted as part of phase one.',
         'linkedDocuments': [{'id': 1, 'name': 'Document 1'}, {'id': 2, 'name': 'Document 2'}],
         'attachments': [{'id': 1, 'name': 'Attachment 1'}, {'id': 2, 'name': 'Attachment 2'}],
         'linkedPersons': [{'id': 1, 'name': 'Person 1'}, {'id': 2, 'name': 'Person 2'}],
         'notes': 'Testing notes'
         };

         self.openDocumentPopup = function ($event) {
         dialog
         .showDialog({
         targetEvent: $event,
         template: cmsTemplate.getPopup('view-document'),
         controller: 'viewDocumentPopCtrl',
         controllerAs: 'ctrl',
         locals: {
         document: self.document
         }
         });
         }*/

    });
};