module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator,
                      lookupService,
                      correspondenceService,
                      g2gLookupService) {
        'ngInject';
        var modelName = 'G2GMessagingHistory';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.securityLevel = model.securityLevel.hasOwnProperty('id') ? model.securityLevel.lookupKey : model.securityLevel;
            model.deliveryDate = generator.getTimeStampFromDate(model.deliveryDate);
            model.sentDate = generator.getTimeStampFromDate(model.sentDate);
            model.updateDate = generator.getTimeStampFromDate(model.updateDate);
            delete model.recordInfo;
            delete model.statusInfo;
            delete model.typeInfo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.mainSiteFrom = new Information(model.mainSiteFrom);
            model.subSiteFrom = new Information(model.subSiteFrom);
            model.securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.deliveryDate = generator.getDateFromTimeStamp(model.deliveryDate, generator.defaultDateTimeFormat);
            model.sentDate = generator.getDateFromTimeStamp(model.sentDate, generator.defaultDateTimeFormat);
            model.updateDate = generator.getDateFromTimeStamp(model.updateDate, generator.defaultDateTimeFormat);

            model.recordInfo = correspondenceService.getCorrespondenceInformation(model);
            model.statusInfo = g2gLookupService.getG2gLookupByCategoryAndLookupKey(g2gLookupService.lookupCategory.trackingActions.name, model.status);
            model.typeInfo = g2gLookupService.getG2gLookupByCategoryAndLookupKey(g2gLookupService.lookupCategory.copyOrOriginal.name, model.type);
            return model;
        });

    })
};