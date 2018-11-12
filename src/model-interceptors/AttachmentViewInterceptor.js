module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'AttachmentView';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.attachmentType = model.attachmentType && model.attachmentType.hasOwnProperty('lookupKey') ? model.attachmentType.lookupKey : model.attachmentType;
            model.securityLevel = model.securityLevel && model.securityLevel.hasOwnProperty('lookupKey') ? model.securityLevel.lookupKey : model.securityLevel;
            if (typeof model.updateActionStatus !== 'undefined' && model.updateActionStatus !== null && model.updateActionStatus !== '')
                model.updateActionStatus = model.updateActionStatus.hasOwnProperty('id') ? model.updateActionStatus.lookupKey : model.updateActionStatus;
            delete model.file;
            delete model.source;
            delete model.progress;
            delete model.refVSID;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};