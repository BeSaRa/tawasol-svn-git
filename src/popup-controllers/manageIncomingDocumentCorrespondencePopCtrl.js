module.exports = function (app) {
    app.controller('manageIncomingDocumentCorrespondencePopCtrl', function (dialog,
                                                                    toast,
                                                                    //sites,
                                                                    langService,
                                                                    correspondence) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageIncomingDocumentCorrespondencePopCtrl';

        self.correspondence = correspondence;

        self.saveCorrespondenceSite = function () {
            self.correspondence
                .saveDocument(false)
                .then(function () {
                    toast.success(langService.get('correspondence_sites_save_success'));
                });
        };
        self.closeDocumentCorrespondence = function () {
            dialog.hide();
        };
    });
};