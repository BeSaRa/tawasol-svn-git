module.exports = function (app) {
    app.run(function (CMSModelInterceptor, moment) {
        'ngInject';
        var modelName = 'FollowupBookCriteria';
        
        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.siteCriteria = null;
            if (model.selectedSiteType && model.selectedSiteType.id) {
                model.siteCriteria = {};
                model.siteCriteria.siteType = model.selectedSiteType.lookupKey;
            }
            if (model.selectedMainSite && model.selectedMainSite.id && model.siteCriteria) {
                model.siteCriteria.mainSiteId = model.selectedMainSite.id;
            }
            if (model.selectedSubSite && model.selectedSubSite.id && model.siteCriteria) {
                model.siteCriteria.subSiteId = model.selectedSubSite.id;
            }
            if (model.fromFollowupDate)
                model.fromFollowupDate = moment(model.fromFollowupDate).startOf("day").valueOf();
            if (model.toFollowupDate)
                model.toFollowupDate = moment(model.toFollowupDate).endOf("day").valueOf();
            if (model.fromDocDate)
                model.fromDocDate = moment(model.fromDocDate).startOf("day").valueOf();
            if (model.toDocDate)
                model.toDocDate = moment(model.toDocDate).endOf("day").valueOf();

            delete model.selectedSiteType;
            delete model.selectedMainSite;
            delete model.selectedSubSite;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });
        
    })
};
