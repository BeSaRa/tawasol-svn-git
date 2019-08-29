module.exports = function (app) {
    app.controller('folderTreePopCtrl', function (langService, dialog, correspondenceService, UserFolder, folders, workItems, showInbox) {
        'ngInject';
        var self = this;
        self.controllerName = 'folderTreePopCtrl';

        self.progress = false;
        self.folders = _checkInboxFolder(showInbox, folders);

        self.selectedWorkItems = workItems;

        self.disableSelected = _checkDisable();

        self.showInbox = showInbox;
        self.fullScreen = false;
        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };

        function _checkDisable() {
            return self.selectedWorkItems.length === 1 ? self.selectedWorkItems[0].getFolderId() : false;
        }

        function _checkInboxFolder(inboxFolder, folders) {
            return inboxFolder ? [new UserFolder({
                arName: langService.getKey('menu_item_user_inbox', 'ar'),
                enName: langService.getKey('menu_item_user_inbox', 'en'),
                id: 0
            }).setChildren(folders)] : folders;
        }

        /**
         * @description move selected workItem to folder
         * @param selectedFolder
         * @returns {*}
         */
        self.moveSelectedToFolders = function (selectedFolder) {
            if (self.progress) {
                return null;
            }
            self.progress = true;
            return correspondenceService
                .addBulkWorkItemsToFolder(self.selectedWorkItems, selectedFolder)
                .then(function (value) {
                    self.progress = false;
                    dialog.hide(value);
                });
        };

        /**
         * @description delete selected workItem from list.
         * @param index
         * @param $event
         */
        self.deleteFromSelectedWorkItem = function (index, $event) {
            workItems.splice(index, 1);
            self.disableSelected = _checkDisable();
        }
    });
};
