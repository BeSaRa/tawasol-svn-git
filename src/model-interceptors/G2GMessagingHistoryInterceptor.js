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
            // all the below properties are removed because service is using the G2GMessaging history but returning G2GMessagingHistoryView
            delete model.mainSiteFrom;
            delete model.subSiteFrom;
            //delete model.sentDate;
            //delete model.sentByOrg;
            delete model.sentBy;
            delete model.mainSiteTo;
            delete model.subSiteTo;
            delete model.typeString;
            delete model.followupStatusString;
            //delete model.followupDate;
            //delete model.receivedByOrg;
            delete model.receivedBy;
            //delete model.deliveryDate;
            delete model.statusString;
            //delete model.incomingDocId;
            //delete model.refIncomingDocId;
            //delete model.updatedByOrg;
            delete model.updatedBy;
            //delete model.updateDate;
            //delete model.comment;
            //delete model.g2GRefNo;
            //delete model.outgoingSerial;
            //delete model.subject;
            delete model.securityLevelString;
            delete model.prioretyLevelString;
            //delete model.isCurrent;
            //delete model.isRead;
            //delete model.creationDocDate;
            //delete model.lockedBy;
            //delete model.lockedDate;
            delete model.senderForTrackingSheet;

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
            model.senderForTrackingSheet = null;
            if(model.sentByOrg){
                if(generator.isJsonString(model.sentByOrg)){
                    model.senderForTrackingSheet = JSON.parse(model.sentByOrg).name;
                }
                else{
                    model.senderForTrackingSheet = model.sentByOrg;
                }
            }

            model.mainSiteTo = new Information(model.mainSiteTo);
            model.subSiteTo = new Information(model.subSiteTo);

            return model;
        });
    })
};