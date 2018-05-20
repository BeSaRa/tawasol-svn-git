module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      correspondenceSiteTypeService,
                      moment,
                      Information) {
        'ngInject';

        var modelName = 'SiteView';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.parentInfo = new Information(model.parentInfo);
            model.correspondenceSiteType = _.find(correspondenceSiteTypeService.correspondenceSiteTypes, function (type) {
                return model.correspondenceSiteTypeId === type.lookupKey;
            });
            return model;
        });
    })
};