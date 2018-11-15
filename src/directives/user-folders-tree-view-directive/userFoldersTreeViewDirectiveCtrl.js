module.exports = function (app) {
    app.controller('userFoldersTreeViewDirectiveCtrl', function (lookupService,
                                                                 userFolderService,
                                                                 $q,
                                                                 $rootScope,
                                                                 langService,
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
         * @param userFolder
         * @param $event
         */
        self.removeUserFolder = function (userFolder, $event) {
            var array = [userFolder.id];
            getChildIds(userFolder, array);
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
         * @param userFolder
         * @param $event
         */
        self.openAddUserFolderDialog = function (userFolder, $event) {
            userFolderService
                .controllerMethod
                .userFolderAdd(userFolder, $event)
                .then(function () {
                    self.reloadUserFolders();
                });
        };

        /**
         * @description Opens dialog for edit user folder
         * @param userFolder
         * @param $event
         */
        self.openEditUserFolderDialog = function (userFolder, $event) {
            userFolderService
                .controllerMethod
                .userFolderEdit(userFolder, $event)
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