module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      generator,
                      Indicator) {
        'ngInject';
        var modelName = 'UserSubscription';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.actionDate = generator.getTimeStampFromDate(model.actionDate);

            delete model.docClassIndicator;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.actionDate = generator.getDateFromTimeStamp(model.actionDate, true);
            model.docClassIndicator = new Indicator().getDocClassIndicator(generator.getDocumentClassName(model.docClassId));
            return model;
        });


    })
};