module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      attachmentTypeService,
                      lookupService,
                      AttachmentType,
                      Information,
                      Lookup) {
        'ngInject';

        var modelName = 'Attachment';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            var file = model.type === 'scanner' ? model.file.file : model.file,
                formData = new FormData(),
                isExternalSourceImport = !!model.externalImportData;
            model.attachmentType = model.attachmentType.hasOwnProperty('lookupKey') ? model.attachmentType.lookupKey : model.attachmentType;
            model.updateActionStatus = model.updateActionStatus.hasOwnProperty('lookupKey') ? model.updateActionStatus.lookupKey : model.updateActionStatus;
            if (model.securityLevel instanceof Lookup) {
                model.securityLevel = model.securityLevel.lookupKey;
            } else if (typeof model.securityLevel !== 'number' && model.securityLevel.hasOwnProperty('id')) {
                model.securityLevel = model.securityLevel.id;
            }
            model.priorityLevel = model.priorityLevel && model.priorityLevel.hasOwnProperty('lookupKey') ? model.priorityLevel.lookupKey : model.priorityLevel;

            delete model.file;
            delete model.refVSID;
            delete model.source;
            delete model.progress;
            delete model.isLinkedExportedDocIndicator;
            delete model.isLinkedExportedDocAttachment;
            delete model.isOfficialIndicator;
            delete model.createReplyDisableDelete;
            delete model.externalImportData;

            if (isExternalSourceImport) {
                return model;
            }

            formData.append('entity', JSON.stringify(model));
            formData.append('content', file || null);
            if (model.vsId) {
                formData.append('withProtect', true);
            }
            return formData;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            //model.attachmentType = attachmentTypeService.getAttachmentTypeByLookupKey(model.attachmentType);
            if (!model.attachmentType && model.classDescription === 'TawasolLinkedAttachment') {
                model.attachmentType = new AttachmentType();//{enName: 'Linked document', arName: 'Linked document'}
                model.isLinkedExportedDocIndicator = model.getIsLinkedExportedDocIndicator();
                model.isLinkedExportedDocAttachment = true;
            } else {
                model.attachmentType = attachmentTypeService.getAttachmentTypeByLookupKey(model.attachmentType);
            }
            if (model.securityLevel && typeof model.securityLevel !== 'number' && !(model.securityLevel instanceof Lookup)) {
                model.securityLevel = model.securityLevel.id;
            }
            model.securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            if (typeof model.updateActionStatus !== 'undefined' && model.updateActionStatus !== null && model.updateActionStatus !== '')
                model.updateActionStatus = lookupService.getLookupByLookupKey(lookupService.attachmentUpdateAction, model.updateActionStatus);
            else {
                // if no value, set FREE_TO_EDIT by default
                model.updateActionStatus = lookupService.getLookupByLookupKey(lookupService.attachmentUpdateAction, 0);
            }

            if (typeof model.priorityLevel !== 'undefined' && model.priorityLevel !== null && model.priorityLevel !== '') {
                model.priorityLevel = lookupService.getLookupByLookupKey(lookupService.attachmentPriority, model.priorityLevel);
            } else {
                model.priorityLevel = lookupService.getLookupByLookupKey(lookupService.attachmentPriority, 1);
            }

            model.isOfficialIndicator = model.getIsOfficialIndicator();
            model.isDeletable = !!model.isDeletable;
            model.attachmentTypeInfo = new Information(model.attachmentTypeInfo);
            model.exportStatus = model.exportStatus || false;
            return model;
        });

    })
};
