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

        // function _getSitesList() {
        //     self.internalSites = _.filter(self.sites, function (item) {
        //         return item.siteCategory === 1;
        //     });
        //     self.externalSites = _.filter(self.sites, function (item) {
        //         return item.siteCategory === 2;
        //     });
        //     self.g2gSites = _.filter(self.sites, function (item) {
        //         return item.siteCategory === 3;
        //     });
        //     self.privateSites = _.filter(self.sites, function (item) {
        //         return item.siteCategory === 4;
        //     });
        // }
        //
        // _getSitesList();

        /**
         * @description export click
         */
        self.exportWorkItem = function () {
            readyToExportService
                .exportReadyToExport(self.readyToExport, self.model)
                .then(function (result) {
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