module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      jobTitleService,
                      generator,
                      lookupService,
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
            model.seqWFEmailSettings = !model.seqWFEmailSettings.length ? 0 : generator.getResultFromSelectedCollection(model.seqWFEmailSettings, 'lookupKey')

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
            if (!generator.validRequired(model.seqWFEmailSettings) || model.seqWFEmailSettings === 0) {
                model.seqWFEmailSettings = [];
            } else {
                var seqWFEmailSettingsList = lookupService.returnLookups(lookupService.seqWFEmailSettings);
                model.seqWFEmailSettings = generator.getSelectedCollectionFromResult(seqWFEmailSettingsList, model.seqWFEmailSettings, 'lookupKey');
            }

            model.mapReceived();
            return model;
        });

    });
};
