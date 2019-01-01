module.exports = function (app) {
    app.run(function (CMSModelInterceptor, layoutService) {
        'ngInject';

        var modelName = 'Layout', naValue = 'N/A';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setLayoutService(layoutService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            //model.mapSend();
            model.arName = model.arName ? model.arName : naValue;
            model.enName = model.enName ? model.enName : naValue;
            delete model.options;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            //model.mapReceived();
            model.arName = (model.arName === naValue) ? null : model.arName;
            model.enName = (model.enName === naValue) ? null : model.enName;
            return model;
        });

    })
};