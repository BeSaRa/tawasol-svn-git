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

        self.needReply = function (status) {
            return (status && status.lookupStrKey === 'NEED_REPLY');
        };

        /**
         * @description Checks if added correspondence sites are valid.
         * If followup status = Need reply, it should have followup date too.
         * In case of outgoing, at least one original site should added.
         * @returns {boolean}
         * If true, the correspondence sites is invalid and disable the save button
         */
        self.checkDisabled = function () {
            var i, record;
            if (self.documentClass.toLowerCase() === 'outgoing') {
                if (self.correspondence.hasSiteTO()) {
                    var inValidSitesCount = 0;
                    for (i = 0; i < self.correspondence.sitesInfoTo.length; i++) {
                        record = self.correspondence.sitesInfoTo[i];
                        if (self.needReply(record.followupStatus) && !record.followupDate) {
                            inValidSitesCount++;
                        }
                    }
                    for (i = 0; i < self.correspondence.sitesInfoCC.length; i++) {
                        record = self.correspondence.sitesInfoCC[i];
                        if (self.needReply(record.followupStatus) && !record.followupDate) {
                            inValidSitesCount++;
                        }
                    }
                    return !!inValidSitesCount;
                }
                return true;
            }
            else {
                if (self.correspondence.site) {
                    record = self.correspondence.site;
                    return !!(self.needReply(record.followupStatus) && !record.followupDate);
                }
                return true;
            }
        };

        self.saveCorrespondenceSites = function () {
            self.correspondence
                .updateSites()
                .then(function () {
                    toast.success(langService.get('correspondence_sites_save_success'));
                });
        };

        self.saveCorrespondenceSite = function () {
            //console.log('save incoming correspondence site');
            self.correspondence.saveDocument()
                .then(function (result) {
                    toast.success(langService.get('correspondence_sites_save_success'));
                });
        };

        self.closeDocumentCorrespondence = function () {
            dialog.hide();
        };
    });
};