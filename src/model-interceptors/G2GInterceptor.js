module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator,
                      correspondenceService) {

        var modelName = 'G2G';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.correspondence.lastModified = generator.getTimeStampFromDate(model.correspondence.lastModified);
            delete model.recordInfo;
            delete model.isLockedG2GIndicator;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.correspondence.classDescription = 'Incoming';
            model.securityLevel = new Information(model.securityLevel);
            model.correspondence.lastModified = generator.getDateFromTimeStamp(model.correspondence.lastModified, true);

            model.isLockedG2GIndicator = model.getIsLockedG2GIndicator();
            model.recordInfo = correspondenceService.getCorrespondenceInformation(model.correspondence);
            return model;
        });

    })
};