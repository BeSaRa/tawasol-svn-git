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
                                                           dialog,
                                                           correspondenceService,
                                                           PartialExportCollection,
                                                           WorkItem) {
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


        self.exportType = 1;

        self.exportTypeList = [
            {id: 1, key: 'export_by_group'},
            {id: 2, key: 'export_by_selection'}
        ];

        // partial exported list
        self.partialExportList = new PartialExportCollection();
        self.exportOptions = self.partialExportList.getKeys();

        self.labels = _.map(self.partialExportList.getKeys(), function (label) {
            return label.toLowerCase();
        });

        self.loadRelatedThings = null;

        var canExportOptions = {
            'ATTACHMENTS': 'Attachment',
            'RELATED_BOOKS': 'LinkedDoc',
            'RELATED_OBJECTS': 'LinkedObj'
        };

        var linkedDataCount = {
            'ATTACHMENTS': 'attachementsNO',
            'RELATED_BOOKS': 'linkedDocsNO',
            'RELATED_OBJECTS': 'linkedEntitiesNO'
        };

        self.checkAnyLinkedDataAvailable = function (type) {
            if (self.readyToExport instanceof WorkItem) {
                if (type)
                    return self.readyToExport.generalStepElm[linkedDataCount[type]];
                return self.readyToExport.generalStepElm.attachementsNO || self.readyToExport.generalStepElm.linkedDocsNO || self.readyToExport.generalStepElm.linkedEntitiesNO;
            }
            else {
                return true;
            }
        };

        self.canExportAnyRelatedData = function () {
            var canExport;
            for (var i in canExportOptions) {
                canExport = self.settings.canExport(canExportOptions[i]);
                if (canExport)
                    break;
            }
            return canExport;// && self.checkAnyLinkedDataAvailable();
        };

        self.canExportRelatedData = function (type) {
            return self.settings.canExport(canExportOptions[type]);// && self.checkAnyLinkedDataAvailable(type);
        };

        self.onChangeExportType = function () {
            self.partialExportList = self.partialExportList.changeExportType();
            if (self.exportType === 2) {
                correspondenceService
                    .loadRelatedThingsForCorrespondence(self.readyToExport)
                    .then(function (result) {
                        self.loadRelatedThings = result;
                    });
            }
        };

        function _selectedItemExists(item, option) {
            return (_getItemPosition(item, option) !== -1);
        }

        function _getItemPosition(item, option) {
            return self.partialExportList.exportItems[option].indexOf(item);
        }

        function _addItem(item, option) {
            self.partialExportList.exportItems[option].push(item);
        }

        function _removeItem(item, option) {
            self.partialExportList.exportItems[option].splice(_getItemPosition(item, option), 1);
        }

        self.toggleSelectedItem = function (item, option) {
            if (_selectedItemExists(item, option)) {
                _removeItem(item, option);
            } else {
                _addItem(item, option);
            }
        };



        /**
         * @description export click
         */
        /*self.exportCorrespondenceWorkItem = function () {
            readyToExportService
                .exportReadyToExport(self.readyToExport, self.model)
                .then(function (result) {
                    toast.success(langService.get('export_success'));
                    dialog.hide(result);
                })
                .catch(function () {
                    toast.error(langService.get('export_failed'));
                });
        };*/

        self.exportCorrespondenceWorkItem = function () {
            if (self.exportType === 1) {
                readyToExportService
                    .exportReadyToExport(self.readyToExport, self.model)
                    .then(function (result) {
                        toast.success(langService.get('export_success'));
                        dialog.hide(result);
                    })
                    .catch(function () {
                        toast.error(langService.get('export_failed'));
                    });
            }
            else {
                readyToExportService
                    .exportReadyToExportSelective(self.readyToExport, self.partialExportList)
                    .then(function (result) {
                        toast.success(langService.get('export_success'));
                        dialog.hide(result);
                    })
                    .catch(function () {
                        toast.error(langService.get('export_failed'));
                    });
            }
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