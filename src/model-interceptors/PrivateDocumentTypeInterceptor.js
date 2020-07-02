module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator,
                      DocumentType) {
        'ngInject';
        var modelName = 'PrivateDocumentType';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouId = generator.getNormalizedValue(model.ouId, 'id');
            model.userId = generator.getNormalizedValue(model.userId, 'id');
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.ouInfo = new Information(model.ouInfo);
            model.userInfo = new Information(model.userInfo);
            model.lookup = generator.interceptReceivedInstance('DocumentType', generator.generateInstance(model.lookup, DocumentType));
            return model;
        });

    })
};
