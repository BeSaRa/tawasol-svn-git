module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
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
            model.typeId = entityTypeService.getLinkedType(model.typeId);
            return model;
        });

    })
};