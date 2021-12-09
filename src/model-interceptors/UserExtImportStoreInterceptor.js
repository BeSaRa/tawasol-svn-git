module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      ExtImportStore,
                      AdminResultRelation,
                      generator) {
        'ngInject';
        var modelName = 'UserExtImportStore';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.extImportStore && model.extImportStore instanceof ExtImportStore) {
                model.extImportStore = generator.interceptSendInstance('ExtImportStore', model.extImportStore);
            }
            model.ouId = generator.getNormalizedValue(model.ouId, 'id');
            model.userId = generator.getNormalizedValue(model.userId, 'id');
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.ouInfo = new AdminResultRelation(model.ouInfo);
            model.userInfo = new Information(model.userInfo);
            model.extImportStore = new ExtImportStore(model.extImportStore);
            return model;
        });

    })
};
