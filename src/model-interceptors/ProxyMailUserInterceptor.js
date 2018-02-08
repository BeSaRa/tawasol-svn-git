module.exports = function (app) {
    app.run(function (CMSModelInterceptor, Information) {
        'ngInject';
        var modelName = 'ProxyMailUser';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.proxyUserOUInfo = new Information(model.proxyUserOUInfo);
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