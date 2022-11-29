module.exports = function (app) {
    app.service('applicationUserSignatureService', function (urlService,
                                                             $http,
                                                             $q,
                                                             generator,
                                                             ApplicationUserSignature,
                                                             _,
                                                             dialog,
                                                             employeeService,
                                                             langService,
                                                             toast,
                                                             encryptionService,
                                                             cmsTemplate,
                                                             InkSignature,
                                                             AppUserCertificate) {
        'ngInject';
        var self = this;
        self.serviceName = 'applicationUserSignatureService';
        self.applicationUserSignatures = [];

        /**
         * @description load user ink signature
         * @returns {*}
         */
        self.loadUserInkSignatures = function () {
            return $http.get(urlService.userInkSignature + '/user-id/' + employeeService.getEmployee().id)
                .then(function (result) {
                    return generator.generateCollection(result.data.rs, InkSignature);
                });
        };
        /**
         * @description add user ink signature
         * @param annotation
         * @returns {*}
         */
        self.addUserInkSignature = function (annotation) {
            var inkSignature = (new InkSignature())
                .setAnnotationContent('Bad idea')
                .setAppUserId(employeeService.getEmployee().id);
            var formData = new FormData();
            formData.append('entity', angular.toJson(inkSignature));
            formData.append('content', new Blob([angular.toJson(annotation)], {type: 'application/pdf'}));
            return $http.post(urlService.userInkSignature, formData, {
                headers: {
                    'Content-Type': undefined
                }
            }).then(function (result) {
                return result.data.rs;
            });
        };
        /**
         * @description delete user ink signature
         * @returns {*}
         * @param vsId
         */
        self.deleteUserInkSignature = function (vsId) {
            return $http.delete(urlService.userInkSignature + '/' + vsId).then(function (result) {
                return result.data.rs;
            });
        };

        /**
         * @description Load the application user signature s from server.
         * @returns {Promise|applicationUserSignatures}
         */
        self.loadApplicationUserSignatures = function (appUserId, isAdmin) {
            appUserId = appUserId.hasOwnProperty('id') ? appUserId.id : appUserId;
            var url = isAdmin ? ('/user-id/' + appUserId + '?asAdmin=' + !!isAdmin) : ('/mobility/user-id/' + appUserId);
            return $http.get(urlService.applicationUserSignatures + url).then(function (result) {
                self.applicationUserSignatures = generator.generateCollection(result.data.rs, ApplicationUserSignature, self._sharedMethods);
                self.applicationUserSignatures = generator.interceptReceivedCollection('ApplicationUserSignature', self.applicationUserSignatures);
                self.applicationUserSignatures = self.applicationUserSignatures.reverse();
                return self.applicationUserSignatures;
            });
        };

        /**
         * @description Get application user signature s from self.applicationUserSignatures if found and if not load it from server again.
         * @returns {Promise|applicationUserSignatures}
         */
        self.getApplicationUserSignatures = function (id) {
            return self.applicationUserSignatures.length ? $q.when(self.applicationUserSignatures) : self.loadApplicationUserSignatures(id);
        };

        /**
         * @description Contains methods for CRUD operations for application user signature s
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to edit application user signature
             * @param applicationUserSignature
             * @param $event
             */
            applicationUserSignatureEdit: function (applicationUserSignature, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('application-user-signature'),
                        controller: 'applicationUserSignaturePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            applicationUserSignature: applicationUserSignature,
                            applicationUserSignatures: self.applicationUserSignatures
                        }
                    });
            }
        };

        /**
         * @description Add new application user signature
         * @param signature
         * @param file
         * @return {Promise|ApplicationUserSignature}
         */
        self.addApplicationUserSignature = function (signature, file) {
            var url = "";
            url = urlService.applicationUserSignatures;
            var form = new FormData();
            form.append('entity', JSON.stringify(generator.interceptSendInstance('ApplicationUserSignature', signature)));
            form.append('content', file);
            return $http.post(url, form, {
                headers: {
                    'Content-Type': undefined
                }
            })
                .then(function (result) {
                    return generator.generateInstance(result.data.rs, ApplicationUserSignature, self._sharedMethods);
                })

        };

        /**
         * @description Update the given application user signature .
         * @param applicationUserSignature
         * @param file
         * @return {Promise|ApplicationUserSignature}
         */
        self.updateApplicationUserSignature = function (applicationUserSignature, file) {
            var url = urlService.applicationUserSignatures + '/update';
            var form = new FormData();
            form.append('entity', JSON.stringify(generator.interceptSendInstance('ApplicationUserSignature', applicationUserSignature)));
            form.append('content', file);
            return $http.post(url, form, {
                headers: {
                    'Content-Type': undefined
                }
            })
                .then(function (result) {
                    return generator.generateInstance(result.data.rs, ApplicationUserSignature, self._sharedMethods);
                })

        };

        /**
         * @description Delete given application user signature .
         * @param applicationUserSignature
         * @return {Promise|null}
         */
        self.deleteApplicationUserSignature = function (applicationUserSignature) {
            var vsId = applicationUserSignature.hasOwnProperty('vsId') ? applicationUserSignature.vsId : applicationUserSignature;
            vsId = vsId.replace(/[{}]/g, "");
            return $http.delete((urlService.applicationUserSignatures + '/' + vsId));
        };

        /**
         * @description Delete bulk application user signature s.
         * @param applicationUserSignatures
         * @return {Promise|null}
         */
        self.deleteBulkApplicationUserSignatures = function (applicationUserSignatures) {
            var bulkIds = applicationUserSignatures[0].hasOwnProperty('id') ? _.map(applicationUserSignatures, 'id') : applicationUserSignatures;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.applicationUserSignatures + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedApplicationUserSignatures = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedApplicationUserSignatures.push(key);
                });
                return _.filter(applicationUserSignatures, function (applicationUserSignature) {
                    return (failedApplicationUserSignatures.indexOf(applicationUserSignature.id) > -1);
                });
            });
        };

        /**
         * @description Get application user signature  by applicationUserSignatureId
         * @param applicationUserSignatureId
         * @returns {ApplicationUserSignature|undefined} return ApplicationUserSignature Model or undefined if not found.
         */
        self.getApplicationUserSignatureById = function (applicationUserSignatureId) {
            applicationUserSignatureId = applicationUserSignatureId instanceof ApplicationUserSignature ? applicationUserSignatureId.id : applicationUserSignatureId;
            return _.find(self.applicationUserSignatures, function (applicationUserSignature) {
                return Number(applicationUserSignature.id) === Number(applicationUserSignatureId);
            });
        };

        /**
         * @description Activate application user signature
         * @param applicationUserSignature
         */
        self.activateApplicationUserSignature = function (applicationUserSignature) {
            return $http
                .put((urlService.applicationUserSignatures + '/activate/' + applicationUserSignature.id))
                .then(function () {
                    return applicationUserSignature;
                });
        };

        /**
         * @description Deactivate application user signature
         * @param applicationUserSignature
         */
        self.deactivateApplicationUserSignature = function (applicationUserSignature) {
            return $http
                .put((urlService.applicationUserSignatures + '/deactivate/' + applicationUserSignature.id))
                .then(function () {
                    return applicationUserSignature;
                });
        };

        /**
         * @description Activate bulk of application user signature s
         * @param applicationUserSignatures
         */
        self.activateBulkApplicationUserSignatures = function (applicationUserSignatures) {
            var bulkIds = applicationUserSignatures[0].hasOwnProperty('id') ? _.map(applicationUserSignatures, 'id') : applicationUserSignatures;
            return $http
                .put((urlService.applicationUserSignatures + '/activate/bulk'), bulkIds)
                .then(function () {
                    return applicationUserSignatures;
                });
        };

        /**
         * @description Deactivate bulk of application user signature s
         * @param applicationUserSignatures
         */
        self.deactivateBulkApplicationUserSignatures = function (applicationUserSignatures) {
            var bulkIds = applicationUserSignatures[0].hasOwnProperty('id') ? _.map(applicationUserSignatures, 'id') : applicationUserSignatures;
            return $http
                .put((urlService.applicationUserSignatures + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return applicationUserSignatures;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param applicationUserSignature
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateApplicationUserSignature = function (applicationUserSignature, editMode) {
            var applicationUserSignaturesToFilter = self.applicationUserSignatures;
            if (editMode) {
                applicationUserSignaturesToFilter = _.filter(applicationUserSignaturesToFilter, function (applicationUserSignatureToFilter) {
                    return applicationUserSignatureToFilter.id !== applicationUserSignature.id;
                });
            }
            return _.some(_.map(applicationUserSignaturesToFilter, function (existingApplicationUserSignature) {
                return existingApplicationUserSignature.docSubject.toLowerCase() === applicationUserSignature.docSubject.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteApplicationUserSignature, self.updateApplicationUserSignature);

        self.emptySignatures = function () {
            self.applicationUserSignatures = [];
        };

        /**
         * @description Loads the certificate of user by userId
         * @param appUserId
         * @returns {*}
         */
        self.loadApplicationUserCertificate = function (appUserId) {
            appUserId = appUserId.hasOwnProperty('id') ? appUserId.id : appUserId;
            return $http.get(urlService.applicationUserSignatures + '/cert/user-id/' + appUserId).then(function (result) {
                if (!result.data.rs) {
                    return null;
                }
                return generator.interceptReceivedInstance('AppUserCertificate', generator.generateInstance(result.data.rs, AppUserCertificate, self._sharedCertificateMethods));
            });
        };

        /**
         * @description Add new application user certificate
         * @param certificate
         * @param file
         * @return {Promise|AppUserCertificate}
         */
        self.addApplicationUserCertificate = function (certificate, file) {
            var form = new FormData();
            form.append('entity', JSON.stringify(generator.interceptSendInstance('AppUserCertificate', certificate)));
            form.append('content', file);
            return $http.post(urlService.applicationUserSignatures + '/cert', form, {
                headers: {
                    'Content-Type': undefined
                }
            })
                .then(function (result) {
                    return generator.generateInstance(result.data.rs, AppUserCertificate, self._sharedCertificateMethods);
                })
        };

        /**
         * @description Delete given application user certificate .
         * @param certificate
         * @return {Promise|null}
         */
        self.deleteApplicationUserCertificate = function (certificate) {
            var vsId = certificate.hasOwnProperty('vsId') ? certificate.vsId : certificate;
            vsId = vsId.replace(/[{}]/g, "");
            return $http.delete((urlService.applicationUserSignatures + '/cert/' + vsId));
        };

        self._sharedCertificateMethods = generator.generateSharedMethods(self.deleteApplicationUserCertificate, self.updateApplicationUserCertificate);
    });
};
