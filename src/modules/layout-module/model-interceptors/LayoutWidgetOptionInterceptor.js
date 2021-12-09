module.exports = function (app) {
    app.run(function (CMSModelInterceptor, layoutService) {
        'ngInject';

        var modelName = 'LayoutWidgetOption';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setLayoutService(layoutService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            //model.mapSend();
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            //model.mapReceived();
            return model;
        });

    })
};