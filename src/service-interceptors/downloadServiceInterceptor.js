module.exports = function (app) {
    app.run(function (CMSModelInterceptor, attachmentService) {
        'ngInject';
        var modelName = 'downloadService';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setAttachmentService(attachmentService);
            return model;
        });

    })
};
