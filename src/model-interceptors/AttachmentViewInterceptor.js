module.exports = function (app) {
    app.run(function (CMSModelInterceptor, lookupService) {
        'ngInject';
        var modelName = 'AttachmentView';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.attachmentType = model.attachmentType && model.attachmentType.hasOwnProperty('lookupKey') ? model.attachmentType.lookupKey : model.attachmentType;
            model.securityLevel = model.securityLevel && model.securityLevel.hasOwnProperty('lookupKey') ? model.securityLevel.lookupKey : model.securityLevel;
            if (typeof model.updateActionStatus !== 'undefined' && model.updateActionStatus !== null && model.updateActionStatus !== '')
                model.updateActionStatus = model.updateActionStatus.hasOwnProperty('lookupKey') ? model.updateActionStatus.lookupKey : model.updateActionStatus;
            delete model.file;
            delete model.source;
            delete model.progress;
            delete model.refVSID;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (typeof model.updateActionStatus === 'undefined' || model.updateActionStatus === null && model.updateActionStatus === '') {
                // if no value, set FREE_TO_EDIT by default
                model.updateActionStatus = lookupService.getLookupByLookupKey(lookupService.attachmentUpdateAction, 0);
            }
            return model;
        });

    })
};