module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      OrganizationUnitView,
                      langService,
                      organizationService) {
        'ngInject';
        var modelName = 'OrganizationUnitView';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setOrganizationService(organizationService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.parentOrReportingToInfo;
            delete model.registryOuIndicator;
            delete model.centralArchiveIndicator;
            delete model.privateRegOuIndicator;
            delete model.notSyncOuIndicator;
            delete model.tempRegOUSection;
            delete model.isOUParentDeleted;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.parentOrReportingToInfo =  model.parent ? model.getParent() : null;
            model.isOUParentDeleted = model.parent && (!model.parentOrReportingToInfo || model.parentOrReportingToInfo.isOUParentDeleted);

            model.registryOuIndicator = model.getRegistryOuIndicator();
            model.privateRegOuIndicator = model.getPrivateRegOuIndicator();
            model.centralArchiveIndicator = model.getCentralArchiveIndicator();
            model.notSyncOuIndicator = model.getNotSyncOuIndicator();
            return model;
        });

    })
};
