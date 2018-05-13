module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator) {
        'ngInject';
        var modelName = 'PartialExport';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.sitesToList = generator.interceptSendCollection('Site', model.sitesToList);
            model.sitesCCList = generator.interceptSendCollection('Site', model.sitesCCList);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};