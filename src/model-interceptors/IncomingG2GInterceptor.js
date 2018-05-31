module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      correspondenceService,
                      Site,
                      lookupService,
                      generator,
                      DocumentComment,
                      Attachment,
                      LinkedObject) {
        'ngInject';
        var modelName = 'IncomingG2G';


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
            model.correspondence.site = model.siteInfo.subSite.id ? new Site({
                mainSiteId: model.siteInfo.mainSite.id,
                subSiteId: model.siteInfo.subSite.id,
                followupStatus: new Information(model.siteInfo.followupStatusResult),
                followupDate: model.siteInfo.followupDate,
                mainEnSiteText: model.siteInfo.mainSite.enName,
                mainArSiteText: model.siteInfo.mainSite.arName,
                subEnSiteText: model.siteInfo.subSite.enName,
                subArSiteText: model.siteInfo.subSite.arName,
                siteType: correspondenceService.getLookup('incoming', 'siteTypes', model.siteInfo.siteType)
            }) : null;

            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

            model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
            model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            model.docClassIndicator = model.getDocClassIndicator();

            return model;
        });

    })
};