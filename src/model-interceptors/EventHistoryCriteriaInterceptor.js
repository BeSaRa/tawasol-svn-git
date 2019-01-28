module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'EventHistoryCriteria';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            // if subsite is selected, search for sub site otherwise if only main site is selected, search for it
            if (model.selectedSubSite && model.selectedSubSite.id) {
                model.sitesInfoTo = model.selectedSubSite.id.toString();
                model.sitesInfoCC = model.selectedSubSite.id.toString();
            }
            else if (model.selectedMainSite && model.selectedMainSite.id) {
                model.sitesInfoTo = model.selectedMainSite.id.toString();
                model.sitesInfoCC = model.selectedMainSite.id.toString();
            }
            delete model.selectedSiteType;
            delete model.selectedMainSite;
            delete model.selectedSubSite;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};