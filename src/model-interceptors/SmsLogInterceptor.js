module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      organizationService,
                      applicationUserService,
                      moment,
                      lookupService,
                      smsTemplateService) {
        'ngInject';

        var modelName = 'SmsLog';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.actionDate_vts;
            delete model.organization;
            delete model.user;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.actionDate_vts = model.actionDate ? generator.getDateFromTimeStamp(model.actionDate, true) : '';
            if (model.ouId) {
                model.organization = organizationService.getOrganizationById(model.ouId, true);
            }
            if (model.actionBy) {
                model.user = applicationUserService.getApplicationUserById(model.actionBy);
            }
            /*if(model.mainDocClassID){
                model.mainDocClass = lookupService.getLookupByLookupId(lookupService.documentClass, model.mainDocClassID);
            }
            if(model.linkedDocClassID){
                model.linkedDocClass = lookupService.getLookupByLookupId(lookupService.documentClass, model.linkedDocClassID);
            }*/
            return model;
        });
    })
};
