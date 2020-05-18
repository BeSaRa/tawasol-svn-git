module.exports = function (app) {
    app.controller('followupFolderTreePopCtrl', function (langService,
                                                          dialog,
                                                          followUpUserService,
                                                          FollowUpFolder,
                                                          folders,
                                                          records,
                                                          showRoot,
                                                          toast) {
        'ngInject';
        var self = this;

        self.controllerName = 'followupFolderTreePopCtrl';

        self.progress = false;
        self.folders = _checkRootFolder(showRoot, folders);

        self.selectedRecords = records;

        self.disableSelected = _checkDisable();

        self.showRoot = showRoot;
        self.fullScreen = false;
        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };

        function _checkDisable() {
            return self.selectedRecords.length === 1 ? self.selectedRecords[0].getFolderId() : false;
        }

        function _checkRootFolder(showRootFolder, folders) {
            return showRootFolder ? [new FollowUpFolder({
                arName: langService.getKey('followup_folders', 'ar'),
                enName: langService.getKey('followup_folders', 'en'),
                id: 0,
                status: false
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
            return followUpUserService
                .addBulkFollowupBooksToFolder(self.selectedRecords, selectedFolder)
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
        self.deleteFromSelectedRecord = function (index, $event) {
            records.splice(index, 1);
            self.disableSelected = _checkDisable();
        }

    });
};
