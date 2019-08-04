module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      Information,
                      _) {
        'ngInject';
        var modelName = 'FollowupOrganization',
            organizations ;

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            organizations = organizationService.returnOrganizations();
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
            model.followeeOUId = _.find(organizations , function (regOU) {
                return regOU.id === model.followeeOUId;
            });
            return model;
        });

    })
};