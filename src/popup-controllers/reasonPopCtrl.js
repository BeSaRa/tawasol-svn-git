module.exports = function (app) {
    app.controller('reasonPopCtrl', function (dialog, comments, _) {
        'ngInject';
        var self = this;
        self.controllerName = 'reasonPopCtrl';
        self.reason = '';
        self.shortDescription = '';
        // all user comments
        self.comments = comments;
        self.selectedComment = null;
        self.commentSearchText = '';

        /**
         * @description to set reason when user select it from comments.
         */
        self.setReason = function () {
            self.reason = self.selectedComment.getComment();
        };
        /**
         * @description send the reason for controller.
         */
        self.sendReason = function () {
            var reason = self.showShortDescription ? {
                description: self.reason,
                shortDescription: self.shortDescription
            } : self.reason
            dialog.hide(reason);
        };

        /**
         * @description close reason reason.
         */
        self.closeReasonPopup = function () {
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

        self.$onInit = function () {
            if (self.reasonText) {
                self.reason = angular.copy(self.reasonText);
            }
        }
    });
};
