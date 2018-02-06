module.exports = function (app) {
    app.controller('manageLinkedDocumentPopCtrl', function (correspondence, dialog, toast, langService, linkedDocs) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageLinkedDocumentPopCtrl';
        self.model = angular.copy(correspondence.setLinkedDocs(linkedDocs));

        self.saveLinkedDocumentsFromCtrl = function () {
            self.correspondence
                .saveLinkedDocuments()
                .then(function () {
                    toast.success(langService.get('success_messages'));
                })
                .catch(function () {
                    toast.success(langService.get('error_messages'));
                })
        };

        self.closeLinkedDocuments = function () {
            dialog.cancel(false);
        }
    });
};