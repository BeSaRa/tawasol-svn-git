module.exports = function (app) {
    app.run(function (CMSModelInterceptor , rootEntity) {
        'ngInject';
        var modelName = 'langService';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setRootEntityService(rootEntity);
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