module.exports = function (app) {
    app.controller('duplicateOptionPopCtrl', function (DuplicateOption, _, dialog, correspondence) {
        'ngInject';
        var self = this;
        self.controllerName = 'duplicateOptionPopCtrl';
        self.duplicateOption = new DuplicateOption();
        self.correspondence = correspondence;
        self.keys = self.duplicateOption.getDuplicateKeys();
        self.fakeItem = _.range((3 - (self.keys.length % 3)) % 3); // this items to make nice look for the layout row.
        self.keyRows = _.chunk(self.keys.concat(_.map(self.fakeItem, function () {
            return 'fake'
        })), 3);

        self.labels = _generateLabels(self.keys);

        /**
         * create labels from keys
         * @param keys
         * @private
         */
        function _generateLabels(keys) {
            var labels = {};
            _.map(keys, function (key) {
                labels[key] = key.toLowerCase();
            });
            return labels;
        }

        /**
         * @description close the duplicate dialog.
         */
        self.closeDuplicateDialog = function () {
            dialog.cancel();
        };
        /**
         * @description sen duplicate options to service.
         */
        self.duplicateCorrespondence = function () {
            dialog.hide(self.duplicateOption);
        }


    });
};