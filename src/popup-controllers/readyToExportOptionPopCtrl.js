module.exports = function (app) {
    app.controller('readyToExportOptionPopCtrl', function (lookupService,
                                                           $q,
                                                           langService,
                                                           toast,
                                                           sites,
                                                           _,
                                                           downloadService,
                                                           readyToExport,
                                                           rootEntity,
                                                           ReadyToExportOption,
                                                           readyToExportService,
                                                           dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'readyToExportOptionPopCtrl';

        self.progress = null;
        self.readyToExport = readyToExport;

        self.model = new ReadyToExportOption();

        self.settings = rootEntity.getGlobalSettings();
        self.correspondenceSites = [].concat(sites.first, _.map(sites.second, function (item) {
            item.ccVerion = true;
            return item;
        }));
        self.internalSites = [];
        self.externalSites = [];
        self.g2gSites = [];
        self.privateSites = [];
        self.hasExternalSite = _.find(self.correspondenceSites, function (item) {
            return item.siteCategory === 2;
        });
        /**
         * @description export click
         */
        self.exportCorrespondenceWorkItem = function () {
            readyToExportService
                .exportReadyToExport(self.readyToExport, self.model)
                .then(function (result) {
                    toast.success(langService.get('export_success'));
                    dialog.hide(result);
                })
                .catch(function () {
                    toast.error(langService.get('export_failed'));
                });
        };

        self.printWithTerminate = function () {
            readyToExportService
                .exportReadyToExport(self.readyToExport, self.model)
                .then(function (result) {
                    downloadService
                        .controllerMethod
                        .mainDocumentDownload(self.readyToExport)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                            dialog.hide(result);
                        });
                })
                .catch(function () {
                    toast.error(langService.get('export_failed'));
                });
        };

        self.closeExportPopupFromCtrl = function () {
            dialog.cancel();
        };

    });
};