module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      lookupService,
                      generator,
                      applicationUserService,
                      themeService) {
        'ngInject';

        var modelName = 'GlobalSetting';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.theme = themeService.getThemeById(model.theme);
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey');
            model.excludedUsersFromAudit = JSON.stringify(_.map(model.excludedUsersFromAudit, 'id'));
            model.fileType = angular.toJson(model.fileType);
            delete model.bannerLogo;
            delete model.loginLogo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.fileType = angular.fromJson(model.fileType);
            model.theme = model.theme && model.theme.hasOwnProperty('id') ? model.theme.id : model.theme;
            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevels, 'lookupKey');
            var excludedUsersFromAudit = model.excludedUsersFromAudit ? JSON.parse(model.excludedUsersFromAudit) : model.excludedUsersFromAudit;
            model.excludedUsersFromAudit = _.filter(applicationUserService.applicationUsers, function (applicationUser) {
                return (excludedUsersFromAudit.indexOf(applicationUser.id) > -1);
            });
            return model;
        });

    })
};