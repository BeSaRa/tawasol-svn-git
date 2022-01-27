module.exports = function (app) {
    app.service('privateUserClassificationService', function (urlService,
                                                              $http,
                                                              $q,
                                                              generator,
                                                              PrivateUserClassification,
                                                              _,
                                                              dialog,
                                                              langService,
                                                              toast,
                                                              Classification,
                                                              cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'privateUserClassificationService';

        self.privateUserClassifications = [];

        /**
         * @description load privateUser classifications
         * @param ouApplicationUser
         * @returns {*}
         */
        self.loadPrivateUserClassifications = function (ouApplicationUser) {
            return $http.post(urlService.userClassification + '/criteria', {
                ouId: ouApplicationUser.getOuId(),
                userId: ouApplicationUser.getApplicationUserId()
            }).then(function (result) {
                self.privateUserClassifications = generator.interceptReceivedCollection('PrivateUserClassification', generator.generateCollection(result.data.rs, PrivateUserClassification, null));
                return self.privateUserClassifications;
            })
        }

        /**
         * @description Contains methods for CRUD operations for private user classifications
         */
        self.controllerMethod = {
            privateUserClassificationAdd: function (privateClassifications, ouApplicationUser, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('add-private-user-classification'),
                        controller: 'addPrivateUserClassificationPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            privateUserClassification: new PrivateUserClassification({
                                ouId: ouApplicationUser.getOuId(),
                                userId: ouApplicationUser.getApplicationUserId()
                            }),
                            privateUserClassifications: self.privateUserClassifications,
                            privateClassifications: privateClassifications,
                            ouApplicationUser: ouApplicationUser
                        }
                    })
            },
            privateUserClassificationEdit: function (privateUserClassification, privateClassifications, ouApplicationUser, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('add-private-user-classification'),
                        controller: 'addPrivateUserClassificationPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            privateUserClassification: angular.copy(privateUserClassification),
                            privateUserClassifications: self.privateUserClassifications,
                            privateClassifications: privateClassifications,
                            ouApplicationUser: ouApplicationUser
                        }
                    })
            }
        };

        /**
         * @description add new private user classifications
         * @return {Promise|privateUserClassification}
         * @param privateUserClassification
         */
        self.addPrivateUserClassification = function (privateUserClassification) {
            return $http
                .post(urlService.userClassification,
                    generator.interceptSendInstance('PrivateUserClassification', privateUserClassification))
                .then(function (result) {
                    return generator.interceptReceivedInstance('PrivateUserClassification', generator.generateInstance(result.data.rs, PrivateUserClassification, self._sharedMethods));
                });
        };
        /**
         * @description make an update for given private user classifications.
         * @return {Promise|privateUserClassification}
         * @param privateUserClassification
         */
        self.updatePrivateUserClassification = function (privateUserClassification) {
            return $http
                .put(urlService.userClassification,
                    generator.interceptSendInstance('PrivateUserClassification', privateUserClassification))
                .then(function () {
                    return generator.interceptReceivedInstance('PrivateUserClassification', generator.generateInstance(privateUserClassification, PrivateUserClassification, self._sharedMethods));
                });
        };

        self.loadPrivateClassifications = function () {
            return $http.get(urlService.classifications + '/user/private')
                .then(function (result) {
                    return generator.interceptReceivedCollection('Classification', generator.generateCollection(result.data.rs, Classification));
                });
        }

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(null, self.updatePrivateUserClassification);

    });
};
