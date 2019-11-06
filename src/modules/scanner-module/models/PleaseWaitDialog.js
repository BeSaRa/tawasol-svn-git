module.exports = function (app) {
    app.factory('PleaseWaitDialog', function (dialog, $timeout) {
        'ngInject';
        var self = this;
        self.waiting = false;
        /**
         * to show scanner please wait dialog
         * @param showValue
         * @param scanning
         * @param buttonCallback
         * @param CCToolkit
         * @param message
         */
        self.show = function (showValue, scanning, buttonCallback, CCToolkit, message) {
            if (showValue) {
                dialog
                    .showDialog({
                        onComplete: function () {
                            self.waiting = true;
                        },
                        template: require('./../templates/please-wait.html'),
                        locals: {
                            scanning: scanning,
                            buttonCallback: buttonCallback || false,
                            CCToolkit: CCToolkit || false,
                            message: message || false
                        },
                        controller: function (dialog) {
                            'ngInject';
                            this.cancelOperation = function () {
                                dialog.cancel();
                            }
                        },
                        controllerAs: 'ctrl',
                        bindToController: true
                    });
            } else {
                if (self.waiting) {
                    self.waiting = false;
                    $timeout(function () {
                        var element = angular.element('#PleaseWaitDialog');
                        if (element.length) {
                            dialog.hide();
                        }
                    }, 200);
                }
            }

        };
        return self;
    });
};
