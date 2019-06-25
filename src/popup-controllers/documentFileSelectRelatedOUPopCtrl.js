module.exports = function (app) {
    app.controller('documentFileSelectRelatedOUPopCtrl', function (organizationService,
                                                                   langService,
                                                                   dialog,
                                                                   _,
                                                                   generator,
                                                                   OUDocumentFile,
                                                                   documentFile) {
        var self = this;
        self.controllerName = 'documentFileSelectRelatedOUPopCtrl';
        self.documentFile = documentFile;
        self.organizations = organizationService.getAllRegistryOrganizations();
        self.showRelatedOUForm = false;
        self.ouDocumentFilesProgress = null;

        self.toggleRelatedOuForm = function (show) {
            self.showRelatedOUForm = !!show;
            if (show) {
                self.ouDocumentFile = new OUDocumentFile({
                    itemOrder: generator.createNewID(self.documentFile.relatedOus, 'itemOrder'),
                    file: self.documentFile.id
                });
            }
        };

        /**
         * @description add and save the organization for document file
         */
        self.addOuDocumentFile = function ($event) {
            self.documentFile.relatedOus.push(self.ouDocumentFile);
            self.toggleRelatedOuForm();
        };

        /**
         * @description Check if the organization is already added to OUDocumentFile
         * @param organization
         */
        self.excludeOrganizationIfExists = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            if (!self.editMode) {
                return _.find(self.documentFile.relatedOus, function (relatedOU) {
                    relatedOU = relatedOU.ouid.hasOwnProperty('id') ? relatedOU.ouid.id : relatedOU.ouid;
                    return relatedOU === organization;
                });
            } else {
                return _.find(self.documentFile.relatedOus, function (relatedOU) {
                    relatedOU = relatedOU.ouid.hasOwnProperty('id') ? relatedOU.ouid.id : relatedOU.ouid;
                    return relatedOU === organization;
                });
            }
        };

        /**
         * @description remove the related organization for document file
         * @param ouDocumentFile
         */
        self.removeOuDocumentFile = function (ouDocumentFile) {
            ouDocumentFile = ouDocumentFile.ouid.hasOwnProperty('id') ? ouDocumentFile.ouid.id : ouDocumentFile.ouid;
            self.documentFile.relatedOus = _.filter(self.documentFile.relatedOus, function (relatedOU) {
                relatedOU = relatedOU.ouid.hasOwnProperty('id') ? relatedOU.ouid.id : relatedOU.ouid;
                return ouDocumentFile !== relatedOU;
            });
            self.toggleRelatedOuForm();
        };


        /**
         * @description Validates the ouDocumentFile form
         * @returns {*}
         */
        self.isRelatedOuFormValid = function () {
            return self.ouDocumentFile.ouid
                && self.ouDocumentFile.itemOrder;
        };

        /**
         * close dialog
         */
        self.closeDialog = function () {
            if (!self.documentFile.relatedOus.length) {
                dialog.cancel();
                return;
            }
            // check if the user need to save the changes or not.
            dialog
                .confirmMessage(langService.get('sure_you_leave_without_save_changes'))
                .then(function () {
                    dialog.cancel();
                });
        };
        /**
         * resolve the promise with the selected organizations
         */
        self.saveSelectedOrganizations = function () {
            dialog.hide(self.documentFile.relatedOus);
        }

    });
};
