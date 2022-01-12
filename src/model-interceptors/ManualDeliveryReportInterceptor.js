module.exports = function (app) {
    app.run(function (CMSModelInterceptor, Information) {
        'ngInject';

        var modelName = 'ManualDeliveryReport';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.subSiteInfo = model.subSiteInfo ? new Information(model.subSiteInfo) : new Information();
            model.mainSiteInfo = model.mainSiteInfo ? new Information(model.mainSiteInfo) : new Information();
            model.deliveryDate = new Date();
            return model;
        });
    })
};
