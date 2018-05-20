module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator) {

        var modelName = 'G2G';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.correspondence.lastModified = generator.getTimeStampFromDate(model.correspondence.lastModified);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.securityLevel = new Information(model.securityLevel);
            model.correspondence.lastModified = generator.getDateFromTimeStamp(model.correspondence.lastModified, true);
            return model;
        });

    })
};