module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      _, 
                      generator, 
                      ouCorrespondenceSiteService, 
                      CorrespondenceSite, 
                      lookupService, 
                      organizationService) {
        'ngInject';

        var modelName = 'OUCorrespondenceSite';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.correspondenceSite = new CorrespondenceSite(model.correspondenceSite);
            model.setOUCorrespondenceSiteService(ouCorrespondenceSiteService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouid = model.ouid.hasOwnProperty('id') ? model.ouid.id : model.ouid;
            model.correspondenceSite.relatedOus = null;
            model.correspondenceSite = generator.interceptSendInstance('CorrespondenceSite', model.correspondenceSite);
            if (model.correspondenceSite.parent)
                model.correspondenceSite.parent = model.correspondenceSite.parent.hasOwnProperty('id') ? model.correspondenceSite.parent.id : model.correspondenceSite.parent;

            delete model.correspondenceSite.children;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.ouid = organizationService.getOrganizationById(model.ouid);
            return model;
        });

    });
};