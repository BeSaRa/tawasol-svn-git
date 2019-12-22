module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      lookupService,
                      generator,
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
            //model.followupStatus = model.followupStatus.hasOwnProperty('id') ? model.followupStatus.lookupKey : model.followupStatus;

            // the only case when there is no followupStatus property is when search by main site only in search screens
            if (model.hasOwnProperty('followupStatus')) {
                if (model.followupStatus.hasOwnProperty('lookupKey')) {
                    model.followupStatus = model.followupStatus.lookupKey;
                }
                else if (model.followupStatus.hasOwnProperty('id')) {
                    model.followupStatus = model.followupStatus.id;
                }
            }
            model.followupDate = model.followupDate ? _getDate(model.followupDate) : null;
            delete model.mainEnSiteText;
            delete model.mainArSiteText;
            delete model.subArSiteText;
            delete model.subEnSiteText;
            delete model.followupStatusResult;
            delete model.siteTypeResult;
            delete model.mainSite;
            delete model.subSite;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.followupDate = (model.followupDate) ? generator.getDateFromTimeStamp(model.followupDate) : model.followupDate;
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
