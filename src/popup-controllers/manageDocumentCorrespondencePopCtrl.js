module.exports = function (app) {
    app.controller('manageDocumentCorrespondencePopCtrl', function (dialog,
                                                                    toast,
                                                                    sites,
                                                                    langService,
                                                                    correspondence) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentCorrespondencePopCtrl';

        self.correspondence = correspondence;

        if (self.correspondence.getInfo().documentClass === 'outgoing') {
            self.correspondence.sitesInfoTo = sites.first;
            self.correspondence.sitesInfoCC = sites.second;
        }
        self.saveCorrespondenceSites = function () {
            self.correspondence
                .updateSites()
                .then(function () {
                    toast.success(langService.get('correspondence_sites_save_success'));
                });
        };
        self.closeDocumentCorrespondence = function () {
            dialog.hide();
        };
    });
};