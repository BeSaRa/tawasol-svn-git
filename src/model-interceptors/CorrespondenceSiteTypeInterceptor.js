module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'CorrespondenceSiteType';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.disabled;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
