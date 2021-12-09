module.exports = function (app) {
    app.run(function (CMSModelInterceptor, layoutService) {
        'ngInject';

        var modelName = 'LayoutWidget';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setLayoutService(layoutService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            //model.mapSend();
            delete model.widget;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            //model.mapReceived();
            model.widget = layoutService.getWidgetById(model.widgetId);
            return model;
        });

    })
};