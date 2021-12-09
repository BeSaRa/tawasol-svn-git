module.exports = function (app) {
    app.run(function (CMSModelInterceptor, authenticationService) {
        'ngInject';
        var modelName = 'RootEntity';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setAuthenticationService(authenticationService);
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
