module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      langService,
                      workflowActionService,
                      Information,
                      applicationUserService,
                      $http,
                      Organization) {
        'ngInject';

        var modelName = 'Employee';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setOrganizationService(organizationService);
            model.setOrganizationModel(Organization);
            model.setWorkflowActionService(workflowActionService);
            model.setApplicationUSerService(applicationUserService);
            model.setHttpService($http);
            // langService.setSelectedLanguageById(model.defaultDisplayLang);
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