module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      generator,
                      lookupService,
                      Information,
                      _) {
        'ngInject';
        var modelName = 'OUViewPermission',
            registryOrganizations;

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            registryOrganizations = organizationService.getAllRegistryOrganizations();
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouId = model.ouId && model.ouId.hasOwnProperty('id') ? model.ouId.id : model.ouId;
            model.userId = model.userId && model.userId.hasOwnProperty('id') ? model.userId.id : model.userId;
            model.securityLevels = (isNaN(model.securityLevels)) ? generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey') : model.securityLevels;

            delete model.id;
            delete model.ouInfo;
            delete model.userInfo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevels, 'lookupKey');

            model.userInfo = new Information(model.userInfo);
            model.ouInfo = new Information(model.ouInfo);
            return model;
        });

    })
};