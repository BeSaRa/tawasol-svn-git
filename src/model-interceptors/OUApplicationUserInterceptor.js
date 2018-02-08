module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      organizationService,
                      roleService,
                      lookupService,
                      langService,
                      applicationUserService,
                      moment,
                      ApplicationUser) {
        'ngInject';

        var modelName = 'OUApplicationUser';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setLangService(langService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.customRoleId = model.customRoleId.hasOwnProperty('id') ? model.customRoleId.id : model.customRoleId;
            model.ouRegistryID =
                model.ouid.hasRegistry
                    ? model.ouid.id
                    : model.ouid.registryParentId;

            model.ouid = model.ouid.id;
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey');
            model.privateUsers = (model.sendToPrivateUsers) ? JSON.stringify(_.map(model.privateUsers, 'id')) : "[]";
            model.managers = (model.sendToManagers) ? JSON.stringify(_.map(model.managers, 'id')) : "[]";
            if (model.proxyUser) {
                // model.proxyUser = model.proxyUser.id;
                getUnixTimeStamp(model, ["proxyStartDate", "proxyEndDate"]);
                model.proxyOUId = model.ouid;
                model.proxyUser = generator.interceptSendInstance('ApplicationUser', model.proxyUser);
            }

            model.ouRegistryID = model.ouRegistryID.hasOwnProperty('id') ? model.ouRegistryID.id : model.ouRegistryID;
            model.proxyAuthorityLevels = generator.getResultFromSelectedCollection(model.proxyAuthorityLevels, 'lookupKey');
            model.applicationUser = generator.interceptSendInstance('ApplicationUser', model.applicationUser);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.applicationUser = new ApplicationUser(model.applicationUser);
            if (!model.ouid.hasOwnProperty('id')) {
                //var organizations = organizationService.organizations;
                organizationService.getOrganizations().then(function (organizations) {
                    model.ouid = _.find(organizations, function (organization) {
                        return organization.id === model.ouid;
                    });
                });

            }
            if (!model.customRoleId.hasOwnProperty('id')) {
                var roles = roleService.roles;
                model.customRoleId = _.find(roles, function (role) {
                    return role.id === model.customRoleId;
                });
            }

            var applicationUsers = applicationUserService.applicationUsers;
            model.privateUsers = (model.privateUsers && !angular.isArray(model.privateUsers)) ? JSON.parse(model.privateUsers) : [];
            if (model.sendToPrivateUsers && model.privateUsers.length) {
                model.privateUsers = _.filter(applicationUsers, function (applicationUser) {
                    return (model.privateUsers.indexOf(applicationUser.id) > -1);
                });
            }
            model.managers = (model.managers && !angular.isArray(model.privateUsers)) ? JSON.parse(model.managers) : [];
            if (model.sendToManagers && model.managers.length) {
                model.managers = _.filter(applicationUsers, function (applicationUser) {
                    return (model.managers.indexOf(applicationUser.id) > -1);
                });
            }

            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            if (typeof model.securityLevels !== "object") {
                model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevels, 'lookupKey');
            }

            if (model.proxyUser) {
                var proxyUser = model.proxyUser.hasOwnProperty('id') ? model.proxyUser.id : model.proxyUser;
                model.proxyUser = _.find(applicationUsers, function (applicationUser) {
                    return applicationUser.id === proxyUser;
                });
                if (typeof model.proxyAuthorityLevels !== "object") {
                    model.proxyAuthorityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.proxyAuthorityLevels, 'lookupKey');
                }
                getDateFromUnixTimeStamp(model, ['proxyStartDate', 'proxyEndDate']);
            }
            return model;
        });


        /**
         * @description Convert Date to Unix Timestamp
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                if (typeof model[modelProperties[i]] !== "string" && typeof model[modelProperties[i]] !== "number" && model[modelProperties[i]]) {
                    var getDate = model[modelProperties[i]].getDate();
                    var getMonth = model[modelProperties[i]].getMonth() + 1;
                    var getFullYear = model[modelProperties[i]].getFullYear();
                    model[modelProperties[i]] = getFullYear + "-" + getMonth + "-" + getDate;
                }
                if (typeof model[modelProperties[i]] === "string" || typeof model[modelProperties[i]] === "object") {
                    model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]], "YYYY-MM-DD").valueOf() : null;
                }
            }
            return model;
        };

        /**
         * @description Convert unix timestamp to Original Date Format (YYYY-MM-DD)
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