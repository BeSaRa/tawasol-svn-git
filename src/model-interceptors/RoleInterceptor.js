module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      applicationUserService,
                      moment,
                      Permission) {
        'ngInject';

        var modelName = 'Role';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            var selectedPermissions = angular.copy(model.customRolePermission);
            model.customRolePermission = [];

            for (var i = 0; i < selectedPermissions.length; i++) {
                model.customRolePermission.push({"permissionId": selectedPermissions[i].id});
            }
            delete model.members;
            delete model.updatedByInfo;
            delete model.updatedBy;
            delete model.updatedOn;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var permissions = model.customRolePermission;
            model.customRolePermission = [];
            for (var i = 0; i < permissions.length; i++) {
                model.customRolePermission.push(new Permission(permissions[i].permission));
            }
            //var applicationUsers = applicationUserService.applicationUsers;
            model.updatedByInfo = new Information(model.updatedByInfo);

            if (model.updatedOn)
                getDateFromUnixTimeStamp(model, ["updatedOn"]);
            return model;
        });

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD') : null;
            }
            return model;
        };

    })
};