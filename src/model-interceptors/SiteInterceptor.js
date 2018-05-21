module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      lookupService,
                      correspondenceService) {
        'ngInject';

        var modelName = 'Site';

        function _getDate(followupDate) {
            var date;
            try {
                date = moment(followupDate).valueOf();
            } catch (e) {

            }
            return isNaN(date) ? null : date;
        }


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.mainSiteId = model.mainSiteId && model.mainSiteId.hasOwnProperty('id') ? model.mainSiteId.id : model.mainSiteId;
            model.subSiteId = model.subSiteId && model.subSiteId.hasOwnProperty('id') ? model.subSiteId.id : model.subSiteId;
            model.siteType = model.siteType && model.siteType.hasOwnProperty('id') ? model.siteType.lookupKey : model.siteType;
            model.followupStatus = model.followupStatus.hasOwnProperty('id') ? model.followupStatus.lookupKey : model.followupStatus;
            model.followupDate = model.followupDate ? _getDate(model.followupDate) : null;
            delete model.mainEnSiteText;
            delete model.mainArSiteText;
            delete model.subArSiteText;
            delete model.subEnSiteText;
            delete model.followupStatusResult;
            delete model.siteTypeResult;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.siteType = correspondenceService.getLookup(model.docClassName, 'siteTypes', model.siteType) || model.siteType;
            model.followupStatus = lookupService.getLookupByLookupKey(lookupService.followupStatus, model.followupStatus);
            model.mainEnSiteText = model.mainSite.enName;
            model.mainArSiteText = model.mainSite.arName;
            model.subArSiteText = model.subSite.arName;
            model.subEnSiteText = model.subSite.enName;
            delete model.docClassName;
            return model;
        });

    })
};