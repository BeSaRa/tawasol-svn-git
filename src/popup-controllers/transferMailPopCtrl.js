module.exports = function (app) {
    app.controller('transferMailPopCtrl', function (workItems,
                                                    correspondenceService,
                                                    dialog,
                                                    isArray,
                                                    organizations,
                                                    currentFollowedUpUser,
                                                    ouApplicationUserService,
                                                    comments) {
        'ngInject';
        var self = this;
        self.controllerName = 'transferMailPopCtrl';
        // selected comment from users comments
        self.selectedComment = null;
        // the default reason for terminate
        self.reason = null;
        // workItems
        self.workItems = angular.copy(workItems);
        // if it is bulk workItems.
        self.isArray = isArray;
        // all comments
        self.comments = comments;
        // all reg ou's for the user
        self.organizations = organizations;
        // current followed up user
        self.currentFollowedUpUser = currentFollowedUpUser;
        // all ouApplication users
        self.ouApplicationUsers = [];
        // selected organization unit
        self.selectedOrganization = null;
        // selected application user to set it
        self.selectedApplicationUser = null;

        self.selectedUserDomain = null;

        self.setSelectedReason = function () {
            self.reason = self.selectedComment.getComment();
        };

        self.setSelectedUser = function () {
            self.selectedUserDomain = null;
            if (self.selectedApplicationUser)
                self.selectedUserDomain = self.selectedApplicationUser.domainName;
        };

        self.itemNeedReason = function () {
            if (!isArray)
                return !self.reason;

            return _.some(self.workItems, function (workItem) {
                return !workItem.reason;
            });
        };

        self.itemNeedUser = function () {
            if (!isArray)
                return !self.selectedApplicationUser;

            return _.some(self.workItems, function (workItem) {
                return !workItem.domainName;
            });
        };

        self.hasCustomReason = function (workItem) {
            return !!workItem.reason;
        };

        self.hasCustomUser = function (workItem) {
            return !!workItem.domainName;
        };

        self.transferMail = function () {
            if (!self.isArray) {
                var info = workItems.getInfo();
                return dialog.hide({
                    wobNumber: info.wobNumber,
                    comment: self.reason,
                    user: self.selectedUserDomain
                });
            } else {
                dialog.hide(_.map(self.workItems, function (workItem) {
                    if (!self.hasCustomReason(workItem)) {
                        workItem.comment = self.reason;
                    }

                    if (!self.hasCustomUser(workItem)) {
                        workItem.user = self.selectedUserDomain
                    }
                    else{
                        workItem.user = workItem.domainName;
                    }
                    return workItem;
                }));
            }
        };

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.getApplicationUsersForOU = function ($event) {
            self.selectedApplicationUser = null;
            return ouApplicationUserService.loadRelatedOUApplicationUsers(self.selectedOrganization)
                .then(function (result) {
                    result = _.filter(result, function (item) {
                        return item.applicationUser.id !== self.currentFollowedUpUser.id;
                    });
                    self.ouApplicationUsers = result;
                    self.selectedApplicationUser = null;
                    if (!self.isArray) {
                        self.workItems.domainName = null;
                    }
                    else {
                        self.workItems = _.map(self.workItems, function (workItem) {
                            workItem.domainName = null;
                            return workItem;
                        });
                    }
                    return result;
                });
        };

        self.closeTransferReason = function () {
            dialog.cancel();
        };

        self.openReasonDialog = function (workItem, $event) {
            correspondenceService
                .openCommentDialog()
                .then(function (reason) {
                    workItem.reason = reason;
                });
        };

        self.nothingNeedUserReason = function () {
            return self.itemNeedReason() || self.itemNeedUser();
        }


    });
};