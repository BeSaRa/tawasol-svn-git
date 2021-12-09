module.exports = function (app) {
    app.run(function (CMSModelInterceptor, dynamicMenuItemService) {
        'ngInject';
        var modelName = 'DynamicMenuItem';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setDynamicMenuItemService(dynamicMenuItemService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.mapSend();
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.mapReceived();
            return model;
        });

    })
};
