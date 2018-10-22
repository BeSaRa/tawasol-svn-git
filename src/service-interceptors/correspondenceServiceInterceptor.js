module.exports = function (app) {
    app.run(function (CMSModelInterceptor, correspondenceStorageService, managerService) {
        'ngInject';
        var modelName = 'correspondenceService';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setManagerService(managerService)
                .setStorageManager(correspondenceStorageService);
            return model;
        });

    })
};