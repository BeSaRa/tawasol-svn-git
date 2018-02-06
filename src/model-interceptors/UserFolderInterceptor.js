module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'UserFolder';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.children;
            delete model.collapsed;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};