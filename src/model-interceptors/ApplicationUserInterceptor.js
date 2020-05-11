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
            model.loginName = model.domainName;

            if (model.signature) {
                delete model.signature;
            }
            model.mapSend();
            delete model.permissions;
            delete model.ouList;
            delete model.organization;
            delete model.signature;
            delete model.userOrganization;
            delete model.certificate;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.mapReceived();
            return model;
        });

    });
};
