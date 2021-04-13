module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator) {
        'ngInject';
        var modelName = 'AzureSearchCriteria';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
