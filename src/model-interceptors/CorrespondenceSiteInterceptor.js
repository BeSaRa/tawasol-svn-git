module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      lookupService,
                      _,
                      generator,
                      OUCorrespondenceSite,
                      ouCorrespondenceSiteService,
                      organizationService,
                      correspondenceSiteService,
                      correspondenceSiteTypeService,
                      CorrespondenceSite) {
        'ngInject';

        var modelName = 'CorrespondenceSite';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setOUCorrespondenceSiteService(ouCorrespondenceSiteService);
            model.setOrganizationService(organizationService);
            model.setCorrespondenceSiteService(correspondenceSiteService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.parent = (model.parent instanceof CorrespondenceSite) ? model.parent.id : model.parent;
            model.correspondenceTypeId = (model.correspondenceTypeId.hasOwnProperty('id') ? model.correspondenceTypeId.lookupKey : model.correspondenceTypeId);
            model.relatedOus = [];
            model.itemOrder = (model.itemOrder === '' || typeof model.itemOrder === 'undefined') ? generator.createNewID(correspondenceSiteService.correspondenceSites, 'itemOrder') : model.itemOrder;
            delete model.children;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.relatedOus = ouCorrespondenceSiteService.getRelatedOUByCorrespondenceSiteId(model.id);
            model.parent = angular.copy(correspondenceSiteService.getCorrespondenceSiteById(model.parent));
            if (model.parent)
                delete model.parent.children;

            model.children = correspondenceSiteService.getSubCorrespondenceSites(model);
            model.correspondenceTypeId = correspondenceSiteTypeService.getCorrespondenceSiteTypeByLookupKey(model.correspondenceTypeId);
            return model;
        });

    })
};
