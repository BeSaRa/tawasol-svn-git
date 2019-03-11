module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment) {
        'ngInject';

        var modelName = 'EventHistoryCriteria';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.sitesInfo = {};
            if (model.selectedSiteType && model.selectedSiteType.id) {
                model.sitesInfo.siteType = model.selectedSiteType.lookupKey;
            }
            if (model.selectedMainSite && model.selectedMainSite.id) {
                model.sitesInfo.mainSiteId = model.selectedMainSite.id;
            }
            if (model.selectedSubSite && model.selectedSubSite.id) {
                model.sitesInfo.subSiteId = model.selectedSubSite.id;
            }

            model.fromActionTime = model.fromActionTime ? moment(model.fromActionTime).startOf("day").valueOf() : moment().subtract(3, 'months').toDate();
            model.toActionTime = model.toActionTime ? moment(model.toActionTime).endOf("day").valueOf() : moment().endOf("day").toDate();

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
