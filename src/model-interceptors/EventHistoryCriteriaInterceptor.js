module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'EventHistoryCriteria';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.sitesInfoTo && model.sitesInfoTo.id)
                model.sitesInfoTo = model.sitesInfoTo.id.toString();
            if (model.sitesInfoCC && model.sitesInfoCC.id)
                model.sitesInfoCC = model.sitesInfoCC.id.toString();

            delete model.selectedSiteType;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};