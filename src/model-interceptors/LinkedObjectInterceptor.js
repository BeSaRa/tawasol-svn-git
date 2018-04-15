module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      correspondenceService,
                      entityTypeService) {
        'ngInject';

        var modelName = 'LinkedObject';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.preparedType();
            model.typeId = entityTypeService.setLinkedType(model.typeId);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var entityTypes = correspondenceService.getLookup(model.documentClass, 'entityTypes');
            if (model && model.hasOwnProperty('documentClass')) {
                model.typeId = entityTypeService.getLinkedType(model.typeId, entityTypes);
            } else {
                model.typeId = entityTypeService.getLinkedType(model.typeId);
            }
            delete model.documentClass;
            return model;
        });

    })
};