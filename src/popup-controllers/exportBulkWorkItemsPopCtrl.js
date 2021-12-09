module.exports = function (app) {
    app.controller('exportBulkWorkItemsPopCtrl', function (workItems, exportedData, langService, toast, cmsTemplate, rootEntity, dialog, ReadyToExportOption, correspondenceService, downloadService) {
        'ngInject';
        var self = this;
        self.controllerName = 'exportBulkWorkItemsPopCtrl';

        self.exportOptions = ['ATTACHMENTS', 'RELATED_BOOKS', 'RELATED_OBJECTS'];

        self.model = new ReadyToExportOption();

        self.disableExport = false;

        self.labels = _.map(self.exportOptions, function (label) {
            return label.toLowerCase();
        });

        self.settings = rootEntity.getGlobalSettings();

        self.workItems = _.map(angular.copy(workItems), function (item) {
            item.sites = exportedData[item.generalStepElm.vsId];
            return item;
        });


        var canExportOptions = {
            'ATTACHMENTS': 'Attachment',
            'RELATED_BOOKS': 'LinkedDoc',
            'RELATED_OBJECTS': 'LinkedObj'
        };

        self.canExportAnyRelatedData = function () {
            var canExport;
            for (var i in canExportOptions) {
                canExport = self.settings.canExport(canExportOptions[i]);
                if (canExport)
                    break;
            }
            return canExport;
        };

        self.canExportRelatedData = function (type) {
            return self.settings.canExport(canExportOptions[type]);
        };

        self.showExportedCorrespondenceSites = function (item, $event) {
            $event.preventDefault();
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('show-exported-sites'),
                    controllerAs: 'ctrl',
                    controller: function () {
                        'ngInject';
                        var ctrl = this;
                        ctrl.workItem = item;
                        ctrl.closeDialog = function () {
                            dialog.cancel();
                        }
                    }
                });
        };


        self.printExportedDocument = function (item) {
            downloadService
                .controllerMethod
                .mainDocumentDownload(item, null, true);
        };

        self.exportWorkItemsFromCtrl = function () {
            self.disableExport = true;
            correspondenceService.exportBulkWorkItems(self.workItems, self.model)
                .then(function (result) {
                    self.disableExport = false;
                    toast.success(langService.get('export_success'));
                    dialog.hide(result);
                })
                .catch(function () {
                    self.disableExport = false;
                });
        };

        self.closeExportPopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};
