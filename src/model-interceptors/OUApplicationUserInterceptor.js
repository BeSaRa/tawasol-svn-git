module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      organizationService,
                      roleService,
                      lookupService,
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
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey');

            /*model.privateUsers = (model.sendToPrivateUsers) ? JSON.stringify(_.map(model.privateUsers, function (privateUser) {
                if (privateUser instanceof OUApplicationUser)
                    return {id: privateUser.applicationUser.id, ouId: privateUser.ouid.id};
                return false;
            })) : "[]";*/
            var privateUsersCopy = angular.copy(model.privateUsers);
            model.privateUsers = (model.sendToPrivateUsers) ? JSON.stringify(getPrivateUsersToSend(privateUsersCopy)) : "[]";

            /*model.managers = (model.sendToManagers) ? JSON.stringify(_.map(model.managers, function (manager) {
                return {id: manager.manager.id, ouId: manager.organization.id};
            })) : "[]";*/
            model.managers = (model.sendToManagers) ? JSON.stringify(_.map(model.managers, function (manager) {
                return manager.organization.id;
            })) : "[]";

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

        var getPrivateUsersToSend = function (privateUsers) {
            var privateUsersToSend = [];
            for (var i = 0; i < privateUsers.length; i++) {
                var privateUser = privateUsers[i];
                if (privateUser instanceof OUApplicationUser) {
                    var index = _.findIndex(privateUsersToSend, {'ouId': privateUser.ouid.id});
                    if (index < 0) {
                        privateUsersToSend.push({
                            ouId: privateUser.ouid.id,
                            id: [privateUser.applicationUser.id]
                        });
                    }
                    else {
                        privateUsersToSend[index].id.push(privateUser.applicationUser.id);
                    }
                }
            }
            return privateUsersToSend;
        };

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.applicationUser = new ApplicationUser(model.applicationUser);

            var defer = $q.defer();
            var organizations = [];
            organizationService.getOrganizations().then(function (result) {
                organizations = result;
                defer.resolve(true);
            });

            defer.promise.then(function () {
                if (!model.ouid.hasOwnProperty('id')) {
                    model.ouid = _.find(organizations, function (organization) {
                        return organization.id === model.ouid;
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
                /*if (model.sendToPrivateUsers && model.privateUsers.length) {
                    var ouApplicationUsers = ouApplicationUserService.ouApplicationUsers;
                    model.privateUsers = _.map(model.privateUsers, function (privateUser) {
                        return _.find(ouApplicationUsers, function (ouApplicationUser) {
                            var ouId = ouApplicationUser.ouid.hasOwnProperty('id') ? ouApplicationUser.ouid.id : ouApplicationUser.ouid;
                            return ouId === privateUser.ouId && ouApplicationUser.applicationUser.id === privateUser.id;
                        })
                    });
                }*/
                if (model.sendToPrivateUsers && model.privateUsers.length) {
                    var ouApplicationUsers = ouApplicationUserService.ouApplicationUsers;
                    var privateUsersCopy = angular.copy(model.privateUsers);
                    model.privateUsers = [];
                    for (var i = 0; i < privateUsersCopy.length; i++) {
                        var savedOuId = privateUsersCopy[i].ouId;
                        var savedApplicationUsers = privateUsersCopy[i].id;
                        for (var j = 0; j < savedApplicationUsers.length; j++) {
                            var applicationUserId = savedApplicationUsers[j];
                            var privateUser = _.find(ouApplicationUsers, function (ouApplicationUser) {
                                var ouId = ouApplicationUser.ouid.hasOwnProperty('id') ? ouApplicationUser.ouid.id : ouApplicationUser.ouid;
                                return ouId === savedOuId && ouApplicationUser.applicationUser.id === applicationUserId;
                            });
                            if (privateUser)
                                model.privateUsers.push(privateUser);
                        }
                    }
                }

                model.managers = (model.managers && !angular.isArray(model.managers)) ? JSON.parse(model.managers) : [];
                if (model.sendToManagers && model.managers.length) {
                    /*model.managers = _.map(model.managers, function (manager) {
                         return {
                             organization: _.find(organizations, {id: manager.ouId}),
                             manager: _.find(applicationUsers, {id: manager.id})
                         }
                     });*/
                    model.managers = _.map(model.managers, function (ouId) {
                        var organization = _.find(organizations, {id: ouId});
                        return {
                            organization: organization,
                            manager: _.find(applicationUsers, {'id': organization.managerId})
                        };
                    })
                }

                var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
                if (typeof model.securityLevels !== "object") {
                    model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevels, 'lookupKey');
                }

                if (model.proxyUser) {
                    /*var applicationUsers = applicationUserService.applicationUsers;*/
                    var proxyUser = model.proxyUser.hasOwnProperty('id') ? model.proxyUser.id : model.proxyUser;
                    model.proxyUser = _.find(applicationUsers, function (applicationUser) {
                        return applicationUser.id === proxyUser;
                    });
                    if (typeof model.proxyAuthorityLevels !== "object") {
                        model.proxyAuthorityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.proxyAuthorityLevels, 'lookupKey');
                    }
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