module.exports = function (app) {
    app.controller('manageGridCorrespondenceSitesPopCtrl', function (dialog,
                                                                    toast,
                                                                    sites,
                                                                    langService,
                                                                    correspondence) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageGridCorrespondenceSitesPopCtrl';

        self.correspondence = correspondence;

        if (self.correspondence && self.correspondence.getInfo().documentClass === 'outgoing') {
            self.correspondence.sitesInfoTo = sites.first;
            self.correspondence.sitesInfoCC = sites.second;
        }

        self.closeDocumentCorrespondence = function () {
            dialog.hide();
        };
    });
};