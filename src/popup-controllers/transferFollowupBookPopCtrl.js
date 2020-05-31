module.exports = function (app) {
    app.controller('transferFollowupBookPopCtrl', function (records,
                                                            _,
                                                            correspondenceService,
                                                            dialog,
                                                            organizations,
                                                            currentFollowedUpUser,
                                                            ouApplicationUserService,
                                                            comments,
                                                            followUpUserService,
                                                            FollowUpFolder,
                                                            langService,
                                                            UserFollowupRequest) {
        'ngInject';
        var self = this;
        self.controllerName = 'transferFollowupBookPopCtrl';
        // selected comment from users comments
        self.selectedComment = null;
        // the default reason
        self.reason = null;
        // records
        self.records = angular.copy(records);
        // if it is bulk records.
        self.isArray = angular.isArray(records);
        // all comments
        self.comments = comments;
        // all ou's under current regOu for the user
        self.organizations = organizations;
        // current followed up user
        self.currentFollowedUpUser = currentFollowedUpUser;
        // all ouApplication users
        self.ouApplicationUsers = [];
        // selected organization unit
        self.selectedOrganization = null;
        // selected application user to set it
        self.selectedApplicationUser = null;

        self.folders = [];
        self.selectedFolder = null;

        self.ouSearchText = '';
        self.commentSearchText = '';
        self.inProgress = false;

        function _checkRootFolder(showRootFolder, folders) {
            return showRootFolder ? [new FollowUpFolder({
                arName: langService.getKey('followup_folders', 'ar'),
                enName: langService.getKey('followup_folders', 'en'),
                id: 0,
                status: false
            }).setChildren(folders)] : folders;
        }

        self.setSelectedReason = function () {
            self.reason = self.selectedComment.getComment();
        };

        function _setCustomAppUser(user) {
            if (!self.isArray) {
                self.records.customAppUser = user;
            } else {
                _.map(self.records, function (item) {
                    item.customAppUser = user;
                    return item;
                });
            }
        }

        self.setSelectedUser = function () {
            self.getUserFollowupFolders();
            _setCustomAppUser(self.selectedApplicationUser);
        };

        self.setSelectedFolder = function (folder) {
            // if root folder or disabled folder, don't do anything
            if (!folder.id || !folder.status) {
                return;
            }
            if (self.selectedFolder && (folder.id === self.selectedFolder.id)) {
                self.selectedFolder = null;
            } else {
                self.selectedFolder = angular.copy(folder);
            }
        };

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.getApplicationUsersForOU = function ($event) {
            self.selectedApplicationUser = null;
            self.folders = [];
            self.selectedFolder = null;
            self.inProgress = true;
            return ouApplicationUserService.loadRelatedOUApplicationUsers(self.selectedOrganization)
                .then(function (result) {
                    result = _.filter(result, function (item) {
                        return item.applicationUser.id !== self.currentFollowedUpUser.id;
                    });
                    self.ouApplicationUsers = result;
                    self.selectedApplicationUser = null;
                    if (!self.isArray) {
                        self.records.customAppUser = null;
                    } else {
                        self.records = _.map(self.records, function (item) {
                            item.customAppUser = null;
                            return item;
                        });
                    }
                    self.inProgress = false;
                    return result;
                });
        };

        /**
         * @description Gets the folder for selected application user
         */
        self.getUserFollowupFolders = function () {
            self.folders = [];
            self.selectedFolder = null;
            if (!self.selectedApplicationUser) {
                return;
            }
            self.inProgress = true;
            followUpUserService.loadFollowupFoldersByOuAndUser(self.selectedOrganization, self.selectedApplicationUser, true)
                .then(function (folders) {
                    self.folders = folders.length ? _checkRootFolder(true, folders) : [];
                    self.inProgress = false;
                })
        };

        self.openReasonDialog = function (item, $event) {
            correspondenceService
                .openCommentDialog()
                .then(function (reason) {
                    item.reason = reason;
                });
        };

        self.itemNeedReason = function () {
            if (!self.isArray)
                return !self.reason;

            return _.some(self.records, function (item) {
                return !item.reason;
            });
        };

        self.itemNeedUser = function () {
            if (!self.isArray)
                return !self.selectedApplicationUser;

            return _.some(self.records, function (item) {
                return !item.customAppUser;
            });
        };

        self.nothingNeedUserReason = function () {
            return self.itemNeedReason() || self.itemNeedUser();
        };

        self.isValidForm = function (form) {
            return (form.$valid && self.selectedFolder && !self.inProgress);
        };

        self.hasCustomReason = function (item) {
            return !!item.reason;
        };

        self.transferFollowupBook = function ($event) {
            var data = null;
            if (!self.isArray) {
                data = new UserFollowupRequest({
                    id: self.records.id,
                    comment: self.reason,
                    toUserId: self.selectedApplicationUser,
                    toOUId: self.selectedOrganization,
                    folderId: self.selectedFolder
                });
            } else {
                data = [];
                _.map(self.records, function (item) {
                    data.push(new UserFollowupRequest({
                        id: item.id,
                        comment: self.hasCustomReason(item) ? item.reason : self.reason,
                        toUserId: item.customAppUser,
                        toOUId: self.selectedOrganization,
                        folderId: self.selectedFolder
                    }));

                    return item;
                });
            }
            return dialog.hide(data);
        };

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

        self.closeTransferReason = function () {
            dialog.cancel();
        };


    });
};
