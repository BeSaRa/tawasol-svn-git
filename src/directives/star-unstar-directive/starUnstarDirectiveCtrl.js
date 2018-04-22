module.exports = function (app) {
    app.controller('starUnstarDirectiveCtrl', function () {//langService
        'ngInject';
        var self = this;
        self.controllerName = 'starUnstarDirectiveCtrl';
        //self.langService = langService;

        /**
         * @description Checks if star will be displayed or not
         * @returns {boolean}
         */
        self.isShowStar = function () {
            return !self.hideStar;
        };

        /**
         * @description Callback for star click
         * @param record
         * @param $event
         */
        self.changeStarUnstar = function (record, $event) {
            self.callback(record, $event);
        }

    });
};