module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      rootEntity,
                      organizationService,
                      roleService,
                      _,
                      Information,
                      lookupService,
                      ProxyUser,
                      langService,
                      applicationUserService,
                      moment,
                      ApplicationUser,
                      $q,
                      OUApplicationUser,
                      ouApplicationUserService) {
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
            model.securityLevels = generator.filterSecurityLevels(model.securityLevels);
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey');

            model.archiveSecurityLevels = generator.filterSecurityLevels(model.archiveSecurityLevels);
            model.archiveSecurityLevels = generator.getResultFromSelectedCollection(model.archiveSecurityLevels, 'lookupKey');

            if (!model.sendToPrivateUsers) {
                model.privateUsers = "{}";
            } else {
                if (angular.isArray(model.privateUsers) && model.privateUsers.length && typeof model.privateUsers[0] !== 'undefined') {
                    model.privateUsers = getPrivateUsersToSend(model, angular.copy(model.privateUsers));
                } else if (angular.isString(model.privateUsers)) {
                    // nothing to do because it is untouched and same as returned from service
                    // if empty array comes from service, change to empty object to keep all empty records in db same
                    model.privateUsers = (model.privateUsers === '[]') ? '{}' : model.privateUsers;
                } else {
                    model.privateUsers = "{}";
                }
            }

            model.managers = (model.sendToManagers) ? JSON.stringify(model.managers) : "[]";
            model.viceManagers = (model.sendToViceManager) ? JSON.stringify(model.viceManagers) : "[]";

            if (model.proxyUser) {
                //   getUnixTimeStamp(model, ["proxyStartDate", "proxyEndDate"]);
                model.proxyStartDate = model.proxyStartDate ? moment(model.proxyStartDate).startOf('day').valueOf() : model.proxyStartDate;
                model.proxyEndDate = model.proxyEndDate ? moment(model.proxyEndDate).endOf('day').subtract(1, 'second').valueOf() : model.proxyEndDate;
                model.proxyOUId = model.proxyUser instanceof ProxyUser ? model.proxyUser.organization.id : model.proxyOUId;
                model.proxyUser = generator.interceptSendInstance('ApplicationUser', model.proxyUser instanceof ProxyUser ? model.proxyUser.applicationUser : model.proxyUser);
            }

            model.ouRegistryID = model.ouRegistryID.hasOwnProperty('id') ? model.ouRegistryID.id : model.ouRegistryID;
            model.proxyAuthorityLevels = generator.getResultFromSelectedCollection(model.proxyAuthorityLevels, 'lookupKey');
            model.applicationUser = generator.interceptSendInstance('ApplicationUser', model.applicationUser);

            if (model.proxyUser && !model.proxyAuthorityLevels) {
                model.proxyAuthorityLevels = generator.getResultFromSelectedCollection(rootEntity.getGlobalSettings().getSecurityLevels(), 'lookupKey');
            }

            delete model.ouInfo;
            delete model.securityLevelsString;
            delete model.archiveSecurityLevelsString;
            delete model.proxyStartDateString;
            delete model.proxyEndDateString;

            return model;
        });

        var getPrivateUsersToSend = function (model, privateUsers) {
            var privateUsersToSendObject = {
                appUserIds: _.map(privateUsers, 'applicationUser.id'),
                ouAppUserIds: []
            };
            privateUsersToSendObject.ouAppUserIds = _.map(model.privateUsers, function (privateUser) {
                if (privateUser instanceof OUApplicationUser)
                    return {id: privateUser.applicationUser.id, ouId: privateUser.ouid.id};
                return false;
            });
            return JSON.stringify(privateUsersToSendObject);
        };

        var getPrivateUsersToReceive = function (model) {
            var privateUsers = [];
            if (model.sendToPrivateUsers && model.privateUsers.hasOwnProperty('appUserIds') && model.privateUsers.appUserIds.length) {
                var ouApplicationUsers = ouApplicationUserService.ouApplicationUsers;
                privateUsers = _.filter(_.map(model.privateUsers.ouAppUserIds, function (privateUser) {
                    return _.find(ouApplicationUsers, function (ouApplicationUser) {
                        var ouId = ouApplicationUser.ouid.hasOwnProperty('id') ? ouApplicationUser.ouid.id : ouApplicationUser.ouid;
                        return ouId === privateUser.ouId && ouApplicationUser.applicationUser.id === privateUser.id;
                    })
                }), function (item) {
                    return typeof item !== 'undefined';
                });
            }

            return privateUsers;
        };

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.applicationUser = new ApplicationUser(model.applicationUser);
            model.ouInfo = new Information(model.ouInfo);

            var defer = $q.defer();
            var organizations = [];
            organizationService.getAllOrganizationsStructure().then(function (result) {
                organizations = result;
                defer.resolve(true);
            });


            defer.promise.then(function () {
                if (model.ouid && !model.ouid.hasOwnProperty('id')) {
                    model.ouid = _.find(organizations, function (organization) {
                        return organization.id === model.ouid;
                    });
                }
                if (model.ouRegistryID && !model.ouRegistryID.hasOwnProperty('id')) {
                    model.ouRegistryID = _.find(organizations, function (organization) {
                        return organization.id === model.ouRegistryID;
                    });
                }

                if (model.customRoleId && !model.customRoleId.hasOwnProperty('id')) {
                    var roles = roleService.roles;
                    model.customRoleId = _.find(roles, function (role) {
                        return role.id === model.customRoleId;
                    });
                }

                var applicationUsers = applicationUserService.applicationUsers;

                //model.privateUsers = (model.privateUsers && angular.isString(model.privateUsers)) ? JSON.parse(model.privateUsers) : {};
                //model.privateUsers = getPrivateUsersToReceive(model);

                model.managers = (model.managers && !angular.isArray(model.managers)) ? JSON.parse(model.managers) : [];
                model.viceManagers = (model.viceManagers && !angular.isArray(model.viceManagers)) ? JSON.parse(model.viceManagers) : [];

                var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
                if (typeof model.securityLevels !== "object") {
                    model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevels, 'lookupKey');
                    model.securityLevels = generator.filterSecurityLevels(model.securityLevels);
                    model.securityLevelsString = model.getSecurityLevelsText();
                }
                if (typeof model.archiveSecurityLevels !== "object") {
                    model.archiveSecurityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.archiveSecurityLevels, 'lookupKey');
                    model.archiveSecurityLevels = generator.filterSecurityLevels(model.archiveSecurityLevels);
                    model.archiveSecurityLevelsString = model.getArchiveSecurityLevelsText();
                }

                if (model.proxyUser) {
                    if (!model.proxyUser.hasOwnProperty('id')) {
                        model.proxyUser = new ApplicationUser({
                            id: model.proxyUser
                        })
                    } else {
                        model.proxyUser = new ApplicationUser(model.proxyUser);
                    }
                    if (typeof model.proxyAuthorityLevels !== "object") {
                        model.proxyAuthorityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.proxyAuthorityLevels, 'lookupKey');
                    }
                    model.proxyStartDateString = model.proxyStartDate ? generator.convertDateToString(model.proxyStartDate) : '';
                    model.proxyEndDateString = model.proxyEndDate ? generator.convertDateToString(model.proxyEndDate) : '';

                    getDateFromUnixTimeStamp(model, ['proxyStartDate', 'proxyEndDate']);
                }

            });
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
