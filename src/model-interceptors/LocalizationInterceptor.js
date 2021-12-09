module.exports = function (app) {
    app.run(function (CMSModelInterceptor, langService) {
        'ngInject';
        var modelName = 'Localization';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setLangService(langService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (!model.isOverrided)
                delete model.id;

            // model.localizationKey = 'pc_' + (model.localizationKey.toLowerCase());
            // model.module = 13;

            delete model.adminResult;
            delete model.cacheKeys;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};