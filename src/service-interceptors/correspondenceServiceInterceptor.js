module.exports = function (app) {
    app.run(function (CMSModelInterceptor, managerService) {
        'ngInject';
        var modelName = 'correspondenceService';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setManagerService(managerService);
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