module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      DocumentFile,
                      generator) {
        'ngInject';

        var modelName = 'OUDocumentFile';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.file = generator.interceptReceivedInstance('DocumentFile', new DocumentFile(model.file));
            return model;
        });

    })
};