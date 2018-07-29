module.exports = function (app) {
    app.factory('PleaseWaitDialog', function (dialog, $timeout, cmsTemplate) {
        'ngInject';
        var self = this;
        self.waiting = false;
        /**
         * to show scanner please wait dialog
         * @param showValue
         * @param scanning
         * @param buttonCallback
         * @param CCToolkit
         */
        self.show = function (showValue, scanning, buttonCallback, CCToolkit) {
            if (showValue) {
                self.waiting = true;
                dialog
                    .showDialog({
                        template: require('./../templates/please-wait.html'),
                        locals: {
                            scanning: scanning,
                            buttonCallback: buttonCallback || false,
                            CCToolkit: CCToolkit || false
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
                    $timeout(function () {
                        dialog.hide();
                        self.waiting = false;
                    }, 200);
                }
            }

        };
        return self;
    });
};