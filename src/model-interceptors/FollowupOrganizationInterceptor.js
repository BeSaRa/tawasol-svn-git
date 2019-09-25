module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      _,
                      WFOrganization) {
        'ngInject';
        var modelName = 'FollowupOrganization';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.followeeOUId = model.followeeOUId && model.followeeOUId.hasOwnProperty('id') ? model.followeeOUId.id : model.followeeOUId;
            model.ouId = model.ouId && model.ouId.hasOwnProperty('id') ? model.ouId.id : model.ouId;
            model.userId = model.userId && model.userId.hasOwnProperty('id') ? model.userId.id : model.userId;

            delete model.id;
            delete model.ouInfo;
            delete model.userInfo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            // ouInfo contains the ou information of followeeOUId
            model.ouInfo = new WFOrganization(model.ouInfo);
            model.canEditDelete = !!_.find(organizationService.organizations, function (ou) {
                return ou.id === model.followeeOUId;
            });
            return model;
        });

    })
};
