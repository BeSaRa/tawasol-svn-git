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
                                                         icnEntryTemplates,
                                                         employeesLinkedEntity,
                                                         langService) {
        'ngInject';
        var self = this;

        self.controllerName = 'icnArchiveOptionsPopCtrl';

        self.correspondence = correspondence;
        self.model = new ReadyToExportOption();
        delete self.model.RELATED_OBJECTS;
        delete self.model.ATTACHMENT_LINKED_DOCS;

        self.entryTemplates = icnEntryTemplates;
        self.employeesLinkedEntity = employeesLinkedEntity;
        self.settings = rootEntity.getGlobalSettings();
        self.rootEntity = rootEntity.returnRootEntity().rootEntity;
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
            //'RELATED_OBJECTS': 'LinkedObj'
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
            const isBulkEmployees = self.employeesLinkedEntity.leading > 1;
            if (self.selectedEntryTemplate.menuItem.isBulk && isBulkEmployees) {
                dialog.confirmMessage(langService.get('confirm_icn_bulk_archive'))
                    .then(function () {
                        _archiveCorrespondence(isBulkEmployees, $event);
                    });
            } else {
                _archiveCorrespondence(false, $event);
            }
        };

        function _archiveCorrespondence(isBulkEmployees, $event) {
            correspondenceService
                .icnArchiveCorrespondence(correspondence, self.validateExportOption(self.model), self.selectedEntryTemplate, isBulkEmployees, $event)
                .then(function (result) {
                    if (result === 'icnArchiveSuccess') {
                        toast.success(langService.get("archive_specific_success").change({name: correspondence.getTranslatedName()}));
                        dialog.hide(true);
                    }
                });
        }


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
