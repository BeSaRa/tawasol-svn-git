module.exports = function (app) {
    app.controller('icnAttachmentOptionsPopCtrl', function (dialog,
                                                            attachmentService,
                                                            correspondence,
                                                            attachmentTypeService,
                                                            correspondenceService,
                                                            lookupService,
                                                            Attachment,
                                                            rootEntity,
                                                            langService,
                                                            icnSearchTemplates,
                                                            toast) {
        'ngInject';
        var self = this;
        self.controllerName = 'icnAttachmentOptionsPopCtrl';
        self.correspondence = correspondence;
        var info = correspondence.getInfo();

        // all attachments types
        self.attachmentTypes = attachmentTypeService.returnAttachmentTypes(info.documentClass);
        // all security level
        self.securityLevel = correspondenceService.getLookup(info.documentClass, 'securityLevels');
        self.attachmentUpdateActions = lookupService.returnLookups(lookupService.attachmentUpdateAction);
        self.icnSearchTemplates = icnSearchTemplates;

        self.attachment = {};
        self.searchTemplate = null;
        // get inherit Security for attachment from GlobalSettings
        self.inheritSecurity = rootEntity.getGlobalSettings().attachmentInheritSecurity;
        if (self.inheritSecurity) {
            self.attachment.securityLevel = correspondence.securityLevel;
        }

        /**
         * @description Gets the iframe for icn search template with attachment properties
         * @param $event
         */
        self.getICNImportForm = function ($event) {
            attachmentService.openICNImportDialog(correspondence, self.attachment, $event)
                .then(function (result) {
                    if (result === 'icnAttachmentSuccess') {
                        toast.success(langService.get('save_success'));
                        dialog.hide(true);
                    }
                });
        };

        self.closePopup = function () {
            dialog.cancel();
        };

    });
};
