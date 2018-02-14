module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'AttachmentView';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.attachmentType = model.attachmentType.lookupKey;
            model.securityLevel = model.securityLevel.hasOwnProperty('id') ? model.securityLevel.lookupKey : model.securityLevel;
            delete model.file;
            delete model.source;
            delete model.progress;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};