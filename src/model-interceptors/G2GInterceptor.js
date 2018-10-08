module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator,
                      correspondenceService,
                      Incoming,
                      Site,
                      g2gLookupService) {

        var modelName = 'G2G';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.correspondence = generator.interceptSendInstance(['Incoming', 'ViewIncoming'], model.correspondence);
            delete model.correspondence.site;
            delete model.correspondence.lastModifiedString;
            delete model.recordInfo;
            //delete model.isLockedG2GIndicator;
            delete model.typeInfo;
            delete model.mainSiteSubSiteString;   // added in model when binding main-site-sub-site directive value in grid
            delete model.isInternalG2GIndicator;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.correspondence = generator.generateInstance(model.correspondence, Incoming);

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

            model.securityLevel = new Information(model.securityLevel);
            model.correspondence.lastModifiedString = generator.getDateFromTimeStamp(model.correspondence.lastModified, true);
            //model.isLockedG2GIndicator = model.getIsLockedG2GIndicator();
            model.recordInfo = correspondenceService.getCorrespondenceInformation(model.correspondence);
            //todo: type info is binded to siteType property until confirmed by Hussam from Abu Al Nassr

            model.typeInfo = g2gLookupService.getG2gLookupByCategoryAndLookupKey(g2gLookupService.lookupCategory.copyOrOriginal.name, model.correspondence.siteType, model.isInternalG2G());
            model.isInternalG2GIndicator = model.getIsInternalG2GIndicator();
            model.setMainSiteSubSiteString();

            return model;
        });

    })
};