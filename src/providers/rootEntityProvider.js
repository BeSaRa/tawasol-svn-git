module.exports = function (app) {
    app.provider('rootEntity', function () {
        'ngInject';
        var self = this,
            rootEntityIdentifier = null,
            rootEntity = null,
            privateKey = 'LAST_ROOT',
            loaded = false;

        self.setRootEntityIdentifier = function (identifier) {
            rootEntityIdentifier = identifier;
        };

        self.getRootEntityIdentifier = function () {
            return rootEntityIdentifier;
        };

        self.setRootEntity = function (entity) {
            rootEntity = entity;
            return self;
        };
        self.getRootEntity = function () {
            return rootEntity;
        };
        self.setPrivateRootEntityKey = function (key) {
            privateKey = key;
            return self;
        };
        self.destroy = function () {
            rootEntity = null;
            rootEntityIdentifier = null;
        };

        self.setLoaded = function (value) {
            loaded = value;
            return self;
        };

        self.$get = function (RootEntity, employeeService, $state, Credentials, GlobalSetting, titleService, generator, lookupService, $rootScope, $sce, errorCode, $cookies, $stateParams, $http, $location, urlService, dialog, $q) {
            'ngInject';
            return {
                loadInformation: function (rootIdentifier, ignoreSSO) {
                    if (rootIdentifier) // to set root entity Identifier
                        self.setRootEntityIdentifier(rootIdentifier);

                    return $http
                        .get(urlService.information, {
                            headers: {
                                'tawasol-entity-Id': self.getRootEntityIdentifier()
                            }
                        })
                        .then(function (result) {
                            self.setLoaded(true);
                            $cookies.put(privateKey, rootIdentifier);
                            dialog.cancel();
                            self.setRootEntity(new RootEntity(result.data.rs));
                            // single sign on
                            rootEntity.checkSSO().then(function (authenticationService) {
                                if (ignoreSSO)
                                    return;
                                authenticationService
                                    .authenticate(new Credentials({
                                        isSSO: true
                                    }))
                                    .then(function (result) {
                                        employeeService.setEmployee(result);
                                        if (!employeeService.isAdminUser()) {
                                            $state.go('app.landing-page', {identifier: rootEntity.getRootEntityIdentifier()});
                                        } else {
                                            $state.go('app.administration.entities', {identifier: rootEntity.getRootEntityIdentifier()});
                                        }
                                    })
                                    .catch(function (reason) {
                                        console.log("SINGLE SIGN ON FAILED !!", reason);
                                    })
                            });
                            titleService.setTitle(self.getRootEntity().getTranslatedAppName());
                            return self.getRootEntity();
                        })

                },
                loadInformationWithoutCancelDialog: function (rootIdentifier) {
                    if (rootIdentifier) // to set root entity Identifier
                        self.setRootEntityIdentifier(rootIdentifier);

                    return $http
                        .get(urlService.information, {
                            headers: {
                                'tawasol-entity-Id': self.getRootEntityIdentifier()
                            }
                        })
                        .then(function (result) {
                            $cookies.put(privateKey, rootIdentifier);
                            //dialog.cancel();
                            self.setRootEntity(new RootEntity(result.data.rs));
                            titleService.setTitle(self.getRootEntity().getTranslatedAppName());
                            return self.getRootEntity();
                        })

                },
                checkRootEntityIdentifier: function (identifier) {
                    return rootEntity && rootEntity.identifierEqual(identifier) ? $q.when({
                        identifier: identifier,
                        same: true
                    }) : $q.reject({identifier: (rootEntity ? rootEntity.rootEntity.identifier : null), same: false});
                },
                needToLoadInformation: function (identifier) {
                    var service = this;
                    return service.getOldIdentifier() === identifier ? $q.resolve(false) : $q.reject(identifier);
                },
                getInformation: function (rootIdentifier) {
                    return rootEntity && rootEntity.identifierEqual(rootIdentifier) ? $q.when(rootEntity) : this.loadInformation(rootIdentifier);
                },
                encryptIdentifier: function (identifier) {

                },
                decryptIdentifier: function () {

                },
                getOldIdentifier: function () {
                    return $cookies.get(privateKey);
                },
                setRootEntityIdentifier: function (identifier) {
                    return self.setRootEntityIdentifier(identifier);
                },
                getRootEntityIdentifier: function () {
                    return self.getRootEntityIdentifier();
                },
                returnRootEntity: function () {
                    return rootEntity;
                },
                returnPublicAnnouncements: function () {
                    return this.returnRootEntity().publicAnnouncements;
                },
                returnGlobalAnnouncements: function () {
                    return this.returnRootEntity().globalAnnouncements;
                },
                getGlobalSettings: function () {
                    return this.returnRootEntity().settings;
                },
                setRootEntityGlobalSetting: function (globalSetting, interceptReceived) {
                    rootEntity.setGlobalSetting(interceptReceived ? generator.interceptReceivedInstance('GlobalSetting', new GlobalSetting(globalSetting)) : globalSetting);
                },
                setFileTypesHashMap: function (map) {
                    rootEntity.setFileTypesHashMapToGlobalSettings(map);
                },
                getFavIcon: function () {
                    return loaded && this.returnRootEntity().settings.loginLogo ? $sce.trustAsResourceUrl(this.returnRootEntity().settings.loginLogo.fileUrl) : false;
                }
            };
        }
    })
};
