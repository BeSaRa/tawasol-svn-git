module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      lookupService,
                      generator,
                      BarcodeSetting,
                      applicationUserService,
                      employeeService,
                      themeService,
                      _) {
        'ngInject';

        var modelName = 'GlobalSetting';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.theme = themeService.getThemeById(model.theme);
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey');
            model.excludedUsersFromAudit = (model.excludedUsersFromAudit && model.excludedUsersFromAudit.length) ? JSON.stringify(_.map(model.excludedUsersFromAudit, 'id')) : JSON.stringify([]);
            if (employeeService.isSuperAdminUser()) {
                if ((model.excludedPermissionList && model.excludedPermissionList.length)) {
                    model.excludedPermissionList = _.map(model.excludedPermissionList, permission => {
                        return permission.hasOwnProperty('id') ? permission.id : permission;
                    })
                    model.excludedPermissionList = JSON.stringify(model.excludedPermissionList);
                } else {
                    model.excludedPermissionList = JSON.stringify([]);
                }
            }
            model.fileType = angular.toJson(model.fileType);
            model.barcodeElements = model.barcodeElements.mapSend();
            model.excludedConversionFileTypes = JSON.stringify(model.excludedConversionFileTypes);
            delete model.bannerLogo;
            delete model.loginLogo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.fileType = angular.fromJson(model.fileType);
            model.excludedConversionFileTypes = model.excludedConversionFileTypes ? JSON.parse(model.excludedConversionFileTypes) : model.excludedConversionFileTypes;
            model.theme = model.theme && model.theme.hasOwnProperty('id') ? model.theme.id : model.theme;
            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevels, 'lookupKey');
            var excludedUsersFromAudit = model.excludedUsersFromAudit ? JSON.parse(model.excludedUsersFromAudit) : model.excludedUsersFromAudit;
            model.excludedUsersFromAudit = _.filter(applicationUserService.applicationUsers, function (applicationUser) {
                return (excludedUsersFromAudit.indexOf(applicationUser.id) > -1);
            });
            try {
                model.barcodeElements = (new BarcodeSetting(angular.fromJson(model.barcodeElements))).mapReceived();
            } catch (e) {
                model.barcodeElements = new BarcodeSetting();
            }
            model.excludedPermissionList = model.excludedPermissionList ? JSON.parse(model.excludedPermissionList) : [];
            return model;
        });

    })
};
