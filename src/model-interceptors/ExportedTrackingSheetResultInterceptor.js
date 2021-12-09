module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      EventHistory,
                      Information) {
        'ngInject';
        var modelName = 'ExportedTrackingSheetResult';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.vts_subSiteInfo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.eventLogViewList = generator.interceptReceivedCollection('EventHistory', generator.generateCollection(model.eventLogViewList, EventHistory));
            model.vts_subSiteInfo = new Information(model.siteInfoView.subSite);
            return model;
        });

    })
};
