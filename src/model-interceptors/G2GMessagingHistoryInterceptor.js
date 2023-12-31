module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      _,
                      configurationService,
                      generator,
                      lookupService,
                      correspondenceService,
                      managerService,
                      g2gReturnedService,
                      g2gLookupService) {
        'ngInject';
        var modelName = 'G2GMessagingHistory', correspondenceSiteTypes = [], g2gSiteType,
            g2gSiteTypeInfo = new Information();

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setCorrespondenceService(correspondenceService);
            model.setManagerService(managerService);
            model.setG2GReturnService(g2gReturnedService);
            correspondenceSiteTypes = correspondenceService.getLookup('outgoing', 'siteTypes');
            g2gSiteType = _.find(correspondenceSiteTypes, function (siteType) {
                return siteType.lookupKey === configurationService.G2G_CORRESPONDENCE_SITES_TYPE;
            });
            if (g2gSiteType) {
                g2gSiteTypeInfo.arName = g2gSiteType.arName;
                g2gSiteTypeInfo.enName = g2gSiteType.enName;
            }
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            //model.securityLevel = model.securityLevel.hasOwnProperty('id') ? model.securityLevel.lkey : model.securityLevel;
            model.securityLevel = angular.isObject(model.securityLevel) && model.securityLevel.hasOwnProperty('id') ? model.securityLevel.lookupKey : model.securityLevel;
            model.deliveryDate = generator.getTimeStampFromDate(model.deliveryDate);
            model.sentDate = generator.getTimeStampFromDate(model.sentDate);
            model.updateDate = generator.getTimeStampFromDate(model.updateDate);
            //model.followupStatus = model.followupStatus.hasOwnProperty('id') ? model.followupStatus.lkey : model.followupStatus;
            model.followupStatus = angular.isObject(model.followupStatus) && model.followupStatus.hasOwnProperty('id') ? model.followupStatus.lookupKey : model.followupStatus;
            model.updatedByOrg = typeof model.updatedByOrg === 'string' ? model.updatedByOrg : JSON.stringify(model.updatedByOrg);

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
            delete model.exportedBy;
            delete model.mainSiteSubSiteString;   // added in model when binding main-site-sub-site directive value in grid
            delete model.isInternalG2GIndicator;
            delete model.internal;
            delete model.customSiteTypeInfo;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.mainSiteFrom = new Information(model.mainSiteFrom);
            model.subSiteFrom = new Information(model.subSiteFrom);
            //model.followupStatus = g2gLookupService.getG2gLookupByCategoryAndLookupKey(g2gLookupService.lookupCategory.followupType.name, model.followupStatus,  model.isInternalG2G());
            model.followupStatus = lookupService.getLookupByLookupKey(lookupService.followupStatus, model.followupStatus);

            //model.securityLevel = g2gLookupService.getG2gLookupByCategoryAndLookupKey(g2gLookupService.lookupCategory.securityLevel.name, model.securityLevel, model.isInternalG2G());
            model.securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);

            model.deliveryDate = generator.getDateFromTimeStamp(model.deliveryDate, generator.defaultDateTimeFormat);
            model.sentDate = generator.getDateFromTimeStamp(model.sentDate, generator.defaultDateTimeFormat);
            model.updateDate = generator.getDateFromTimeStamp(model.updateDate, generator.defaultDateTimeFormat);

            model.recordInfo = correspondenceService.getCorrespondenceInformation(model);
            model.recordInfo.documentClass = 'outgoing';

            //model.statusInfo = g2gLookupService.getG2gLookupByCategoryAndLookupKey(g2gLookupService.lookupCategory.trackingActions.name, model.status, model.isInternalG2G());
            model.statusInfo = lookupService.getLookupByLookupKey(lookupService.messageStatus, model.status);

            //model.type = 1 - model.type; //Todo: this is the temporary invert of value as discussed with Hussam
            //model.typeInfo = g2gLookupService.getG2gLookupByCategoryAndLookupKey(g2gLookupService.lookupCategory.copyOrOriginal.name, model.type, model.isInternalG2G());
            model.typeInfo = model.getTranslatedOriginalCopy();

            model.senderForTrackingSheet = null;
            if (model.sentByOrg) {
                if (generator.isJsonString(model.sentByOrg)) {
                    model.senderForTrackingSheet = JSON.parse(model.sentByOrg).name;
                    model.exportedBy = JSON.parse(model.sentByOrg).name;
                } else {
                    model.senderForTrackingSheet = model.sentByOrg;
                    model.exportedBy = model.sentByOrg;
                }
            }

            model.mainSiteTo = new Information(model.mainSiteTo);
            model.subSiteTo = new Information(model.subSiteTo);


            model.isInternalG2GIndicator = model.getIsInternalG2GIndicator();

            model.setMainSiteSubSiteString();

            if (!model.hasOwnProperty('customSiteTypeInfo') || model.customSiteTypeInfo.id === -1) {
                model.customSiteTypeInfo = g2gSiteTypeInfo;
            }

            model.updatedByOrg = generator.isJsonString(model.updatedByOrg) ? JSON.parse(model.updatedByOrg) : model.updatedByOrg;

            return model;
        });
    })
};
