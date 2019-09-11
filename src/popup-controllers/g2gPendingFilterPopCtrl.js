module.exports = function (app) {
    app.controller('g2gPendingFilterPopCtrl', function (_,
                                                        toast,
                                                        dialog,
                                                        $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'g2gPendingFilterPopCtrl';

        self.maxDate = new Date();
        self.mainSiteSearchText = '';

        $timeout(function () {
            if (!self.criteria.dateTo) {
                self.criteria.dateTo = self.maxDate;
            }
        });

        self.setCriteria = function ($event) {
            dialog.hide(self.criteria);
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };
    });
};
