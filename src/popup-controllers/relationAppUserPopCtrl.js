module.exports = function (app) {
    app.controller('relationAppUserPopCtrl', function (_,
                                                       $scope,
                                                       LangWatcher,
                                                       generator,
                                                       dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'relationAppUserPopCtrl';
        LangWatcher($scope);

        /**
         * @description Saves the updated record
         */
        self.save = function () {
            return self.updateMethod(self.record)
                .then(function (result) {
                    dialog.hide(true);
                })
                .catch(function (error) {
                    dialog.cancel('serviceError');
                });
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }
    });
};