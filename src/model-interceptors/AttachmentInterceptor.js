module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      attachmentTypeService,
                      lookupService,
                      AttachmentType,
                      Lookup) {
        'ngInject';

        var modelName = 'Attachment';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            var file = model.type === 'scanner' ? model.file.file : model.file, formData = new FormData();
            model.attachmentType = model.attachmentType.lookupKey;
            model.updateActionStatus = model.updateActionStatus.lookupKey;
            // model.securityLevel = .hasOwnProperty('id') ? model.securityLevel.lookupKey : model.securityLevel;
            //model.securityLevel = self.document.securityLevel;
            if (model.securityLevel instanceof Lookup) {
                model.securityLevel = model.securityLevel.lookupKey;
            }
            else if (typeof model.securityLevel !== 'number' && model.securityLevel.hasOwnProperty('id')) {
                model.securityLevel = model.securityLevel.id;
            }

            delete model.file;
            delete model.refVSID;
            delete model.source;
            delete model.progress;
            delete model.isLinkedExportedDocIndicator;
            delete model.isLinkedExportedDocAttachment;

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
                self.isLinkedExportedDocAttachment = true;
            }
            else
                model.attachmentType = attachmentTypeService.getAttachmentTypeByLookupKey(model.attachmentType);

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

            return model;
        });

    })
};