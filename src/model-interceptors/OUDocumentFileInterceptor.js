module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      DocumentFile, 
                      generator) {
        'ngInject';

        var modelName = 'OUDocumentFile';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.file = new DocumentFile(model.file);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};