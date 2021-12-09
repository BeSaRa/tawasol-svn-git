module.exports = function (app) {
    app.controller('conditionalApprovePopCtrl', function (dialog, moment, correspondence, comments, $scope, generator, $timeout) {
        'ngInject';
        var self = this;

        self.correspondence = correspondence;
        self.comments = comments;
        self.conditionalApproveForm = null;

        self.model = {
            exportDate: generator.getFutureDate(1),
            comments: null
        };

        self.minDate = generator.getFutureDate(1);
        self.minDate.setHours(0, 0, 0, 0);
        self.minDateString = moment(self.minDate).format(generator.defaultDateFormat);

        self.selectedComment = null;
        self.commentSearchText = '';

        self.setComment = function () {
            self.model.comments = self.selectedComment.getComment();
        };

        /**
         * @description Checks if the data is valid
         * @param form
         * @returns {boolean}
         */
        self.isValidModel = function (form) {
            form = form || self.conditionalApproveForm;
            return form.$valid
                && (!!self.model.exportDate && generator.getTimeStampFromDate(self.model.exportDate) >= generator.getTimeStampFromDate(self.minDate));
        };

        /**
         * @description Approves the correspondence
         * @param $event
         */
        self.approve = function ($event) {
            if (!self.isValidModel()) {
                return;
            }
            dialog.hide(self.model);
        };

        self.closePopup = function ($event) {
            dialog.cancel('CONDITIONAL_APPROVE_REJECTED');
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

        self.$onInit = function () {
            $timeout(function () {
                self.conditionalApproveForm = $scope.conditionalApproveForm;
            });
        }
    });
};
