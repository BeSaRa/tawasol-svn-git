module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator) {
        'ngInject';

        var modelName = 'AttachmentDelete';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.attachmentType = model.attachmentType.hasOwnProperty('lookupKey') ? model.attachmentType.lookupKey : model.attachmentType;
            model.securityLevel = model.securityLevel.hasOwnProperty('lookupKey') ? model.securityLevel.lookupKey : model.securityLevel;
            if (typeof model.updateActionStatus !== 'undefined' && model.updateActionStatus !== null && model.updateActionStatus !== '')
                model.updateActionStatus = model.updateActionStatus.hasOwnProperty('lookupKey') ? model.updateActionStatus.lookupKey : model.updateActionStatus;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};