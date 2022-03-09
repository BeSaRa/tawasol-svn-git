module.exports = function (app) {
    app.controller('reassignFollowupBookPopCtrl', function (record,
                                                            _,
                                                            correspondenceService,
                                                            dialog,
                                                            followUpUserService,
                                                            dynamicFollowUpRules,
                                                            reassignFollowup,
                                                            comments,
    ) {
        'ngInject';
        var self = this;
        self.controllerName = 'reassignFollowupBookPopCtrl';
        // record
        self.record = angular.copy(record);

        // all comments
        self.selectedComment = null;
        self.comments = comments;
        self.commentSearchText = '';
        self.ruleSearchText = '';
        self.dynamicFollowupRules = dynamicFollowUpRules;
        self.model = reassignFollowup;

        self.setComment = function () {
            self.model.comments = self.selectedComment.getComment();
        };

        /**
         * @description
         */
        self.reassignFollowupDocument = function ($event) {
            followUpUserService.reassignFollowupBooks(self.model).then(function () {
                dialog.hide();
            })
        }

        self.isDynamicRuleVisible = function (rule) {
            return rule.status && rule.id !== self.model.oldDynamicRuleId;
        }

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        self.closeReassignFollowup = function () {
            dialog.cancel();
        };
    });
};
