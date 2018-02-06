module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator) {
        'ngInject';

        var modelName = 'AttachmentDelete';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.attachmentType = model.attachmentType.hasOwnProperty('id') ? model.attachmentType.id : model.attachmentType;
            model.securityLevel = model.securityLevel.hasOwnProperty('id') ? model.securityLevel.id : model.securityLevel;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};