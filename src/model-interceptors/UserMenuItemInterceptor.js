module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator, DynamicMenuItem) {
        'ngInject';
        var modelName = 'UserMenuItem';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.menuItem = generator.interceptSendInstance('DynamicMenuItem', model.menuItem);
            model.id = null;
            delete model.arName;
            delete model.enName;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.menuItem = generator.interceptReceivedInstance('DynamicMenuItem', generator.generateInstance(model.menuItem, DynamicMenuItem));
            return model;
        });

    })
};
