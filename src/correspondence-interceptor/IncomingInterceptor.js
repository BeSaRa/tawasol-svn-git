module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      correspondenceService,
                      generator,
                      Site,
                      lookupService) {
        'ngInject';
        var modelName = 'Incoming';


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.site)
                model.site.getSiteToIncoming(model);

            delete model.site;

            /*If Document has vsId(update document), we will not remove the content file.
             If document don't has vsId(new document), we will remove the content file, so it doesn't affect the save request model */
            if (!model.hasVsId() && model.contentFile)
                delete model.contentFile;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.site = model.subSiteId ? new Site({
                mainSiteId: model.mainSiteId,
                subSiteId: model.subSiteId,
                followupStatus: new Information(model.followupStatusInfo),
                followupDate: model.followupDate,
                mainEnSiteText: model.mainSiteInfo ? model.mainSiteInfo.enName : null,
                mainArSiteText: model.mainSiteInfo ? model.mainSiteInfo.arName : null,
                subEnSiteText: model.subSiteInfo ? model.subSiteInfo.enName : null,
                subArSiteText: model.subSiteInfo ? model.subSiteInfo.arName : null,
                siteType: correspondenceService.getLookup('incoming', 'siteTypes', model.siteType)
            }) : null;
            model.siteTypeInfo = model.siteTypeInfo ? new Information(model.siteTypeInfo) : new Information();
            model.subSiteInfo = model.subSiteInfo ? new Information(model.subSiteInfo) : new Information();
            model.mainSiteInfo = model.mainSiteInfo ? new Information(model.mainSiteInfo) : new Information();
            model.refDocDate ? model.refDocDate = generator.getDateFromTimeStamp(model.refDocDate) : null;

            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

            model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
            model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            model.docClassIndicator = model.getDocClassIndicator();

            return model;
        });

    })
};