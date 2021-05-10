module.exports = function (app) {
    app.controller('manageDocumentCorrespondencePopCtrl', function (dialog,
                                                                    toast,
                                                                    sites,
                                                                    langService,
                                                                    _,
                                                                    $state,
                                                                    correspondence) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentCorrespondencePopCtrl';

        self.correspondence = correspondence;

        self.model = angular.copy(correspondence);


        if (self.correspondence.getInfo().documentClass === 'outgoing') {
            if (self.correspondence.hasVsId()) {
                self.correspondence.sitesInfoCC = sites.second;
                self.correspondence.sitesInfoTo = sites.first;
            }
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
            } else {
                if (self.correspondence.site) {
                    record = self.correspondence.site;
                    return !!(self.needReply(record.followupStatus) && !record.followupDate);
                }
                return true;
            }
        };
        /**
         * @description in case if outgoing
         */
        self.saveCorrespondenceSites = function () {
            if (!self.isExternalOrG2GInCentralArchive()) {
                dialog.alertMessage(langService.get("can_not_add_archive_without_g2g_external_site"));
            } else {
                if (!self.correspondence.hasVsId()) {
                    self.updateCurrentModel();
                    return dialog.hide(self.model);
                }

                self.correspondence
                    .updateSites()
                    .then(function () {
                        self.updateCurrentModel();
                        toast.success(langService.get('correspondence_sites_save_success'));
                    });
            }
        };
        /**
         * @description in cas if incoming
         */
        self.saveCorrespondenceSite = function () {
            if (!self.correspondence.hasVsId()) {
                self.updateCurrentModel();
                return dialog.hide(self.correspondence);
            }

            self.correspondence
                .saveIncomingSite()
                .then(function () {
                    self.updateCurrentModel();
                    toast.success(langService.get('correspondence_sites_save_success'));
                });
        };

        self.closeDocumentCorrespondence = function () {
            dialog.hide(self.model);
        };

        self.updateCurrentModel = function () {
            self.model = angular.copy(self.correspondence);
        }

        self.isExternalOrG2GInCentralArchive = function () {
            var isExternalOrG2G = true;
            if ($state.current.name === 'app.central-archive.ready-to-export') {
                return isExternalOrG2G = _.find(self.correspondence.sitesInfoTo.concat(self.correspondence.sitesInfoCC), function (site) {
                    return site.siteType.isExternalSiteType() || site.siteType.isGovernmentSiteType();
                });
            }

            return isExternalOrG2G;
        }
    });
};
