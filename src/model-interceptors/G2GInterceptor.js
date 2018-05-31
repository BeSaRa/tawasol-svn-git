module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator,
                      correspondenceService,
                      Incoming,
                      Site) {

        var modelName = 'G2G';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.correspondence = generator.interceptSendInstance(['Incoming','ViewIncoming'], model.correspondence);

            model.correspondence.lastModified = generator.getTimeStampFromDate(model.correspondence.lastModified);

            delete model.correspondence.site;
            delete model.correspondence.lastModifiedString;
            delete model.recordInfo;
            delete model.isLockedG2GIndicator;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.correspondence = generator.generateInstance(model.correspondence,Incoming);

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

            /*model.siteTypeInfo = model.siteTypeInfo ? new Information(model.siteTypeInfo) : new Information();
            model.subSiteInfo = model.subSiteInfo ? new Information(model.subSiteInfo) : new Information();
            model.mainSiteInfo = model.mainSiteInfo ? new Information(model.mainSiteInfo) : new Information();

*/
            model.securityLevel = new Information(model.securityLevel);
            model.correspondence.lastModifiedString = generator.getDateFromTimeStamp(model.correspondence.lastModified, true);

            model.isLockedG2GIndicator = model.getIsLockedG2GIndicator();
            model.recordInfo = correspondenceService.getCorrespondenceInformation(model.correspondence);
            return model;
        });

    })
};