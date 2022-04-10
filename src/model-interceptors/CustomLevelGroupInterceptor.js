module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'CustomLevelGroup';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.levels = JSON.stringify(model.levels);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.levels = JSON.parse(model.levels);

            return model;
        });

    })
};
