module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator) {
        'ngInject';
        var modelName = 'G2GMessagingHistory';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.deliveryDate = generator.getTimeStampFromDate(model.deliveryDate);
            model.sentDate = generator.getTimeStampFromDate(model.sentDate);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.mainSiteFrom = new Information(model.mainSiteFrom);
            model.subSiteFrom = new Information(model.subSiteFrom);
            model.securityLevelString = new Information(model.securityLevelString);
            model.deliveryDate = generator.getDateFromTimeStamp(model.deliveryDate);
            model.sentDate = generator.getDateFromTimeStamp(model.sentDate);
            return model;
        });

    })
};