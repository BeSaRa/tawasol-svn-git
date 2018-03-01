module.exports = function (app) {
    app.controller('addToUserFolderPopCtrl', function (lookupService,
                                                       UserFolder,
                                                       $q,
                                                       langService,
                                                       toast,
                                                       validationService,
                                                       userFolderService,
                                                       generator,
                                                       dialog,
                                                       currentNode,
                                                       itemsToAdd,
                                                       allItemsToAdd,
                                                       isBulkAdd) {
        'ngInject';
        var self = this;

        self.controllerName = 'addToUserFolderPopCtrl';

        self.userFolders = userFolderService.userFolders;
        self.currentNodeCopy = currentNode;
        self.currentNode = angular.copy(currentNode);
        self.itemsToAdd = itemsToAdd;
        self.allItemsToAdd = allItemsToAdd;
        self.isBulkAdd = isBulkAdd;

        /**
         * @description Add the item to selected folder
         * @param $event
         */
        self.addToFolder = function ($event) {
            if (self.currentNode !== self.currentNodeCopy) {
                userFolderService
                    .singleAddToFolder(self.itemsToAdd, self.currentNode)
                    .then(function (result) {
                        if (result)
                            dialog.hide(self.currentNode);
                        else
                            dialog.hide(-1);
                    });
            }
            else {
                toast.info(langService.get('cannot_add_to_same_folder'));
            }
        };

        /**
         * @description Add the bulk items to selected folder
         * @param $event
         */
        self.addToFolderBulk = function ($event) {
            userFolderService
                .bulkAddToFolder(self.itemsToAdd, self.currentNode)
                .then(function (result) {
                    if (result.length === self.itemsToAdd.length) {
                        toast.error(langService.get("inbox_failed_add_to_folder_selected"));

                    } else if (result.length) {
                        generator.generateFailedBulkActionRecords('add_to_folder_success_except_following',
                            _.map(_.filter(self.allItemsToAdd, function (item) {
                                return result.indexOf(item.workObjectNumber) > -1
                            }), function (failedItem) {
                                return failedItem.getTranslatedName();
                            }));
                        dialog.hide(self.currentNode);
                    } else {
                        toast.success(langService.get("add_to_folder_success"));
                        dialog.hide(self.currentNode);
                    }

                });
        };

        /**
         * @description Close the popup
         */
        self.closeAddToUserFolderPopupFromCtrl = function () {
            dialog.cancel();
        };

    });
};