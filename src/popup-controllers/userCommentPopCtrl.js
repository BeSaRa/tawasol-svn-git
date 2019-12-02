module.exports = function (app) {
    app.controller('userCommentPopCtrl', function (dialog,
                                                   _,
                                                   toast,
                                                   langService,
                                                   userComment,
                                                   userCommentService,
                                                   organizationsForAppUser) {
        'ngInject';
        var self = this;
        self.controllerName = 'userCommentPopCtrl';

        self.userComment = userComment;
        self.model = angular.copy(self.userComment);
        self.editMode = !!self.model.id;
        self.organizationsForAppUser = organizationsForAppUser;
        self.skipAddDisabled = !self.editMode && !!self.model.ouId;
        if (self.skipAddDisabled) {
            self.organizationsForAppUser = _.filter(self.organizationsForAppUser, function (ou) {
                return ou.id === self.model.ouId;
            })
        }

        /**
         * @description Add the new user comment
         */
        var _addUserComment = function () {
            // override status to true if adding from launch screen
            if (self.skipAddDisabled) {
                self.userComment.status = true;
            }
            userCommentService
                .addUserComment(self.userComment)
                .then(function (result) {
                    toast.success(langService.get('save_success'));
                    dialog.hide(result);
                });
        };

        /**
         * @description Updates the user comment
         */
        var _editUserComment = function () {
            userCommentService
                .updateUserComment(self.userComment)
                .then(function () {
                    toast.success(langService.get('update_success'));
                    dialog.hide();
                });
        };

        self.saveUserComment = function () {
            if (!self.userComment.id) {
                _addUserComment();
            } else {
                _editUserComment();
            }
        };

        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
