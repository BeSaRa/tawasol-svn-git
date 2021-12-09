module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'UserFolder', naValue = 'N/A';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.arName = model.arName ? model.arName : naValue;
            model.enName = model.enName ? model.enName : naValue;
            delete model.children;
            delete model.collapsed;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.arName = (model.arName === naValue) ? null : model.arName;
            model.enName = (model.enName === naValue) ? null : model.enName;
            return model;
        });

    })
};