module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      _,
                      WFOrganization,
                      lookupService,
                      generator) {
        'ngInject';
        var modelName = 'FollowupOrganization';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.followeeOUId = model.followeeOUId && model.followeeOUId.hasOwnProperty('id') ? model.followeeOUId.id : model.followeeOUId;
            model.ouId = model.ouId && model.ouId.hasOwnProperty('id') ? model.ouId.id : model.ouId;
            model.userId = model.userId && model.userId.hasOwnProperty('id') ? model.userId.id : model.userId;
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey');

            delete model.id;
            delete model.ouInfo;
            delete model.userInfo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            // ouInfo contains the ou information of followeeOUId
            model.ouInfo = new WFOrganization(model.ouInfo);
            model.canEditDelete = !!_.find(organizationService.organizations, function (ou) {
                return ou.id === model.followeeOUId;
            });
            model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevels, 'lookupKey');

            return model;
        });

    })
};
