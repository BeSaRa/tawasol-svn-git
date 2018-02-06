module.exports = function (app) {
    app.run(function (CMSModelInterceptor, layoutService) {
        'ngInject';

        var modelName = 'Layout';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setLayoutService(layoutService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            //model.mapSend();
            delete model.options;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            //model.mapReceived();
            return model;
        });

    })
};