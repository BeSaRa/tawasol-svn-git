module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator) {
        'ngInject';
        var modelName = 'UserMenuItem';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.menuItem = generator.interceptSendInstance('DynamicMenuItem', model.menuItem);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
