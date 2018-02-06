module.exports = function (app) {
    app.controller('startSerialPopCtrl', function (dialog , referencePlanItemStartSerialList) {
        'ngInject';
        var self = this;
        self.controllerName = 'startSerialPopCtrl';
        self.referencePlanItemStartSerialList = angular.copy(referencePlanItemStartSerialList);
        // self.referencePlanItemStartSerialList = [];
        /**
         * @description save Start Serial for Selected list Item
         */
        self.saveStartReferencePlanItem = function () {
            dialog.hide(self.referencePlanItemStartSerialList);
        };
        /**
         * @description cancel dialog
         */
        self.closeStartReferencePlanItem = function () {
            dialog.cancel();
        }
    });
};