module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator) {
        'ngInject';

        var modelName = 'PrivateAnnouncement';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.startDate = generator.getTimeStampFromDate(model.startDate);
            model.endDate = generator.getTimeStampFromDate(model.endDate);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model.startDate)
                model.startDate = generator.getDateObjectFromTimeStamp(model.startDate, true, false);
            if (model.endDate)
                model.endDate = generator.getDateObjectFromTimeStamp(model.endDate, false, true);
            return model;
        });
    })
};