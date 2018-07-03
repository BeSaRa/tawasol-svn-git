module.exports = function (app) {
    app.service('loginDialogService', function (dialog, $q, langService, cmsTemplate, $rootScope) {
        'ngInject';
        var self = this;
        // service name
        self.serviceName = 'loginDialogService';
        // promise var to store the promise when open the dialog to callback the
        self.promise = null;
        // variable to catch the current login dialog status if it is true then dialog opend.
        self.openStatus = false;
        self.locationPath = null;

        self.sessionMessage = false;

        /**
         * @description method to open login dialog
         * @returns {promise}
         */
        self.openLoginDialog = function (url) {
            if (self.openStatus) {
                return $q.reject();
            }
            var scope = $rootScope.$new(false);
            scope.callback = self.callback;
            scope._loginDialog = true;
            self.openStatus = true;
            return self.promise = dialog.showDialog({
                template: cmsTemplate.getPopup('login'),
                controller: 'loginCtrl',
                controllerAs: 'login',
                scope: scope,
                escapeToClose: false
            });
        };
        /**
         * method to check if login dialog already opend or not.
         * @returns {boolean}
         */
        self.alreadyOpend = function () {
            return self.openStatus;
        };
        /**
         * callback function to run after user logged in successful.
         */
        self.callback = function () {
            // hide the current dialog [ login Dialog ]
            dialog.hide();
            // when the promise resolved then callback anonymous function that should be
            // turn openStatus to false
            // and force the current state to reload again.
            self.promise.then(function () {
                // openState to be false after resolve the promise
                self.openStatus = false;
            })
        };

        self.displaySessionMessage = function () {
            if (!self.sessionMessage) {
                dialog.errorMessage(langService.get('session_expired')).then(function () {
                    self.sessionMessage = false;
                });
                self.sessionMessage = true;
            }
        }
    });
};
