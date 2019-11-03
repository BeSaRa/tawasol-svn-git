module.exports = function (app) {
    app.config(function ($mdDialogProvider) {
        'ngInject';
        /**
         * @description scannerDialog
         * @name scannerDialog
         * @type function
         */
        $mdDialogProvider.addPreset('scannerDialog', {
            methods: ['scanning', 'buttonCallback', 'CCToolkit', 'message'],
            options: function () {
                return {
                    template: require('./../templates/please-wait.html'),
                    controller: function (dialog) {
                        'ngInject';
                        this.cancelOperation = function () {
                            dialog.cancel();
                        }
                    },
                    controllerAs: 'ctrl',
                    bindToController: true
                }
            }
        })

    });
};
