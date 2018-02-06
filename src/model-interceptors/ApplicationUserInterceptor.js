module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      jobTitleService,
                      organizationService) {
        'ngInject';

        var modelName = 'ApplicationUser';


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setOrganizationService(organizationService);
            model.signature = [];
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.signature) {
                delete model.signature;
            }
            model.mapSend();
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.mapReceived();
            return model;
        });

    });
};