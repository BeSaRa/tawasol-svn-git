module.exports = function (app) {
    app.run(function (CMSModelInterceptor, langService) {
        'ngInject';

        var modelName = 'Lookup';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setLangService(langService);
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