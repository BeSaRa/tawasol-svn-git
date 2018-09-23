module.exports = function (app) {
    app.run(function (CMSModelInterceptor, correspondenceStorageService, managerService) {
        'ngInject';
        var modelName = 'correspondenceService';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setManagerService(managerService)
                .setStorageManager(correspondenceStorageService);
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