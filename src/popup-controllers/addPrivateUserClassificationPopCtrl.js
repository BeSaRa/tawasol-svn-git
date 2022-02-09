module.exports = function (app) {
    app.controller('addPrivateUserClassificationPopCtrl', function (lookupService,
                                                                    privateUserClassificationService,
                                                                    PrivateUserClassification,
                                                                    $q,
                                                                    langService,
                                                                    toast,
                                                                    dialog,
                                                                    editMode,
                                                                    privateClassifications,
                                                                    _,
                                                                    privateUserClassifications,
                                                                    $timeout,
                                                                    generator,
                                                                    securityLevels,
                                                                    ouApplicationUser,
                                                                    privateUserClassification) {
        'ngInject';
        var self = this;
        self.controllerName = 'addPrivateUserClassificationPopCtrl';
        self.editMode = editMode;
        self.privateClassificationsList = privateClassifications;
        self.privateUserClassifications = privateUserClassifications;

        self.privateUserClassification = privateUserClassification;
        self.privateUserClassificationCopy = angular.copy(self.privateUserClassification);
        self.securityLevels = securityLevels;

        /**
         * @description add private user classification
         */
        self.addPrivateUserClassification = function () {
            privateUserClassificationService.addPrivateUserClassification(self.privateUserClassification).then(function (result) {
                dialog.hide(result);
            });
        };
        /**
         *@description edit private user classification
         */
        self.editPrivateUserClassification = function () {
            privateUserClassificationService.updatePrivateUserClassification(self.privateUserClassification).then(function () {
                dialog.hide(self.privateUserClassification);
            });
        };

        /**
         * @description Filter already added classification to skip it in dropdown.
         * @returns {Array}
         */
        self.excludedClassifications = _.map(angular.copy(self.privateUserClassifications), 'classification.id');

        self.excludeClassificationsIfExists = function (classification) {
            return self.excludedClassifications.indexOf(classification.id) > -1;
        };

        self.setSecurityLevels = function ($event) {
            self.privateUserClassification.viewSecurityLevels = null;
            self.privateUserClassifications.archiveSecurityLevels = null;
            // exclude "private personal" from security level
            self.securityLevels = self.privateUserClassification.filterSecurityLevels(ouApplicationUser);
        }

        /**
         * @description close the popup
         */
        self.closePopUp = function () {
            dialog.cancel();
        }
    });
};
