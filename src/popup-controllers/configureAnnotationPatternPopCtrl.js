module.exports = function (app) {
    app.controller('configureAnnotationPatternPopCtrl', function (toast,
                                                                  _,
                                                                  dialog,
                                                                  employeeService,
                                                                  applicationUser,
                                                                  PDFService,
                                                                  $cookies,
                                                                  langService,
                                                                  applicationUserService) {
        'ngInject';
        var self = this;
        self.controllerName = 'configureAnnotationPatternPopCtrl';

        self.infoPattern = [];

        /**
         * @description Checks if user information annotation pattern is valid
         * @returns {boolean}
         */
        self.isValidPattern = function () {
            return self.infoPattern && self.infoPattern.length > 0 && _.some(self.infoPattern, function (item) {
                return !!item.selected;
            });
        }

        /**
         * @description Saves the user information annotation pattern
         * @param $event
         */
        self.savePattern = function ($event) {
            if (!self.isValidPattern()) {
                console.log('INVALID_USER_INFO_ANNOTATION_PATTERN');
                return;
            }

            applicationUser.setSignAnnotationSettings(self.infoPattern);
            applicationUserService.updateApplicationUser(applicationUser)
                .then(function (result) {
                    employeeService.getEmployee().setSignAnnotationSettings(self.infoPattern);
                    $cookies.remove(PDFService.cookieAttachedTypeKey);
                    toast.success(langService.get('annotation_configuration_success'));
                    dialog.hide();
                })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
