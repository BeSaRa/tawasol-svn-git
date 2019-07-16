module.exports = function (app) {
    app.controller('icnArchiveOptionsPopCtrl', function (lookupService,
                                                         toast,
                                                         errorCode,
                                                         ReadyToExportOption,
                                                         PartialExportCollection,
                                                         _,
                                                         cmsTemplate,
                                                         correspondence,
                                                         rootEntity,
                                                         dialog,
                                                         correspondenceService,
                                                         icnEntryTemplates) {
        'ngInject';
        var self = this;

        self.controllerName = 'icnArchiveOptionsPopCtrl';

        self.correspondence = correspondence;
        self.model = new ReadyToExportOption();
        self.entryTemplates = icnEntryTemplates;
        self.settings = rootEntity.getGlobalSettings();
        self.selectedEntryTemplate = null;

        // partial exported list
        self.partialExportList = new PartialExportCollection();
        self.exportOptions = self.partialExportList.getKeys();

        self.labels = _.map(self.partialExportList.getKeys(), function (label) {
            return label.toLowerCase();
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

        /**
         * @description export workItem
         */
        self.archiveCorrespondence = function ($event) {
            correspondenceService.openICNArchiveDialog(correspondence, self.validateExportOption(self.model), self.selectedEntryTemplate, $event);
        };

        // validate before send to export
        self.validateExportOption = function (exportOption) {
            _.map(canExportOptions, function (value, key) {
                if (!self.settings.canExport(value)) {
                    exportOption.hasOwnProperty(key) ? exportOption[key] = false : null;
                }
            });
            return exportOption;
        };

        self.closePopup = function () {
            dialog.cancel('close');
        };
    });
};
