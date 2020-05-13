module.exports = function (app) {
    app.controller('userFoldersTreeViewDirectiveCtrl', function (lookupService,
                                                                 userFolderService,
                                                                 $q,
                                                                 $rootScope,
                                                                 langService,
                                                                 followUpUserService,
                                                                 toast,
                                                                 dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'userFoldersTreeViewDirectiveCtrl';
        self.currentLang = langService.current;

        /**
         * @description reload user folders from server
         */
        self.reloadUserFolders = function () {
            if (self.followup) {
                followUpUserService
                    .getFollowupFolders(true)
                    .then(function (result) {
                        self.folders = result;
                    });
                return;
            }
            userFolderService
                .getUserFoldersForApplicationUser()
                .then(function (result) {
                    self.folders = result;
                });
        };

        /**
         * @description get child records to delete
         * @param folder
         * @param array
         * @returns {*}
         */
        function getChildIds(folder, array) {
            for (var i = 0; i < folder.children.length; i++) {
                array.push(folder.children[i].id);
                getChildIds(folder.children[i], array);
            }
            return array;
        }

        /**
         * @description Delete user folder and sub folders
         * @param folders
         * @param $event
         */
        self.removeUserFolder = function (folders, $event) {
            var array = [folders.id];
            getChildIds(folders, array);

            if (self.followup) {
                followUpUserService
                    .controllerMethod
                    .followupFolderDeleteBulk(array.reverse())
                    .then(function () {
                        self.reloadUserFolders();
                    });
                return;
            }

            userFolderService
                .controllerMethod
                .userFolderDeleteBulk(array.reverse(), $event)
                .then(function () {
                    $rootScope.$broadcast('$folder_deleted');
                    self.reloadUserFolders();
                });
        };

        /**
         * @description Opens dialog for add new user folder
         * @param folder
         * @param $event
         */
        self.openAddUserFolderDialog = function (folder, $event) {
            if (self.followup) {
                followUpUserService
                    .controllerMethod
                    .followupFolderAdd(folder, $event)
                    .then(function () {
                        self.reloadUserFolders();
                    });
                return;
            }


            userFolderService
                .controllerMethod
                .userFolderAdd(folder, $event)
                .then(function () {
                    self.reloadUserFolders();
                });
        };

        /**
         * @description Opens dialog for edit user folder
         * @param userFolder
         * @param $event
         */
        self.openEditUserFolderDialog = function (folder, $event) {
            if (self.followup) {
                followUpUserService
                    .controllerMethod
                    .followupFolderEdit(folder, $event)
                    .then(function () {
                        self.reloadUserFolders();
                    });
                return;
            }

            userFolderService
                .controllerMethod
                .userFolderEdit(folder, $event)
                .then(function () {
                    self.reloadUserFolders();
                });
        };

        /**
         * @description Toggles the child nodes on click of parent node
         * @param selectedNode
         */
        self.toggleChildNodes = function (selectedNode) {
            selectedNode.collapsed = !selectedNode.collapsed;
        };

        /**
         * @description Highlight the selected node
         * @param selectedNode
         */
        self.selectCurrentNode = function (selectedNode) {
            if (selectedNode.id === self.currentNode)
                self.currentNode = null;
            else
                self.currentNode = selectedNode.id;
        };

    });
};
