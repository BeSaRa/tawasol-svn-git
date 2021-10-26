module.exports = function (app) {
    app.service('userFolderService', function (urlService,
                                               $http,
                                               $q,
                                               generator,
                                               UserFolder,
                                               _,
                                               dialog,
                                               langService,
                                               employeeService,
                                               toast,
                                               cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'userFolderService';

        self.userFolders = [];
        self.allUserFolders = [];

        self.childrenFolders = {};

        /**
         * @description Load the User Folders from server.
         * @returns {Promise|userFolders}
         */
        self.loadUserFolders = function () {
            return $http.get(urlService.userFolders).then(function (result) {
                self.userFolders = generator.generateCollection(result.data.rs, UserFolder, self._sharedMethods);
                self.userFolders = generator.interceptReceivedCollection('UserFolder', self.userFolders);
                self.allUserFolders = angular.copy(self.userFolders);
                return self.userFolders;
            });
        };

        self.getUserFoldersForApplicationUser = function () {
            return self.loadUserFolders()
                .then(function (result) {
                    self.userFolders = self.getNestedParentChildrenFolders(result);
                    return self.userFolders;
                })
        };

        /**
         * @description convert array to nested parent child for treeview
         * @returns {Array}
         */
        self.getNestedParentChildrenFolders = function (userFolders) {
            return self.separateParentFromChildren(userFolders).getChildrenForParents(self.userFolders);
        };

        self.getChildrenForParents = function (folders) {
            for (var i = 0; i < folders.length; i++) {
                if (self.childrenFolders.hasOwnProperty(folders[i].id)) {
                    folders[i].children = self.childrenFolders[folders[i].id];
                } else {
                    folders[i].children = [];
                }
                if (folders[i].children) {
                    self.getChildrenForParents(folders[i].children);
                }
            }
            return folders;
        };

        self.separateParentFromChildren = function (userFolders) {
            self.userFolders = [];
            self.childrenFolders = {};
            _.map(userFolders, function (folder) {
                if (!folder.parent) {
                    self.userFolders.push(folder);
                } else {
                    if (!self.childrenFolders.hasOwnProperty(folder.parent)) {
                        self.childrenFolders[folder.parent] = [];
                    }
                    self.childrenFolders[folder.parent].push(folder);
                }
            });
            return self;
        };

        /**
         * @description Get User Folders from self.userFolders if found and if not load it from server again.
         * @returns {Promise|userFolders}
         */
        self.getUserFolders = function () {
            return self.userFolders.length ? $q.when(self.userFolders) : self.loadUserFolders();
        };

        /**
         * @description Contains methods for CRUD operations for User Folders
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add to User Folder
             * @param itemToAdd
             * @param {number} currentFolderId
             * @param selectedItem
             * @param $event
             */
            addToUserFolder: function (itemToAdd, currentFolderId, selectedItem, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('add-to-user-folder'),
                        controller: 'addToUserFolderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            itemsToAdd: new Array(itemToAdd),
                            currentNode: currentFolderId,
                            allItemsToAdd: new Array(selectedItem),
                            isBulkAdd: false
                        }
                    });
            },
            /**
             * @description Opens popup to add bulk items to User Folder
             * @param itemsToAdd
             * @param allSelectedItems
             * @param $event
             */
            addToUserFolderBulk: function (itemsToAdd, allSelectedItems, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('add-to-user-folder'),
                        controller: 'addToUserFolderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            itemsToAdd: itemsToAdd,
                            currentNode: null,
                            allItemsToAdd: allSelectedItems,
                            isBulkAdd: true
                        }
                    });
            },
            /**
             * @description Opens popup to add new User Folder
             * @param userFolder
             * @param $event
             */
            userFolderAdd: function (userFolder, $event) {
                var parentFolder = angular.copy(userFolder);
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('user-folder'),
                        controller: 'userFolderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            userFolder: new UserFolder(
                                {
                                    itemOrder: generator.createNewID(self.userFolders, 'itemOrder'),
                                    parent: userFolder ? userFolder.id : null
                                }),
                            parent: parentFolder
                        }
                    });
            },
            /**
             * @description Opens popup to edit User Folder
             * @param userFolder
             * @param $event
             */
            userFolderEdit: function (userFolder, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('user-folder'),
                        controller: 'userFolderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            userFolder: userFolder,
                            parent: null
                        }
                    });
            },
            /**
             * @description Show confirm box and delete User Folder
             * @param userFolder
             * @param $event
             */
            userFolderDelete: function (userFolder, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: userFolder.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteUserFolder(userFolder).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: userFolder.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk User Folders
             * @param userFolders
             * @param $event
             */
            userFolderDeleteBulk: function (userFolders, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_folder_subfolder'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkUserFolders(userFolders)
                            .then(function (result) {
                                /* var response = false;
                                 if (result.length === userFolders.length) {
                                     toast.error(langService.get("failed_delete_selected"));
                                     response = false;
                                 } else if (result.length) {
                                     generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (userFolder) {
                                         return userFolder.getNames();
                                     }));
                                     response = true;
                                 } else {
                                     toast.success(langService.get("delete_success"));
                                     response = true;
                                 }
                                 return response;*/
                            });
                    });
            }
        };

        /**
         * @description Add new User Folder
         * @param userFolder
         * @return {Promise|UserFolder}
         */
        self.addUserFolder = function (userFolder) {
            return $http
                .post(urlService.userFolders,
                    generator.interceptSendInstance('UserFolder', userFolder))
                .then(function (result) {
                    return generator.interceptReceivedInstance('UserFolder', generator.generateInstance(result.data.rs, UserFolder, self._sharedMethods));
                });
        };

        /**
         * @description Update the given User Folder.
         * @param userFolder
         * @return {Promise|UserFolder}
         */
        self.updateUserFolder = function (userFolder) {
            return $http
                .put(urlService.userFolders,
                    generator.interceptSendInstance('UserFolder', userFolder))
                .then(function () {
                    return generator.interceptReceivedInstance('UserFolder', generator.generateInstance(userFolder, UserFolder, self._sharedMethods));
                });
        };

        /**
         * @description Delete given User Folder.
         * @param userFolder
         * @return {Promise|null}
         */
        self.deleteUserFolder = function (userFolder) {
            var id = userFolder.hasOwnProperty('id') ? userFolder.id : userFolder;
            return $http.delete((urlService.userFolders + '/' + id));
        };

        /**
         * @description Delete bulk User Folders.
         * @param userFolders
         * @return {Promise|null}
         */
        self.deleteBulkUserFolders = function (userFolders) {
            var bulkIds = userFolders[0].hasOwnProperty('id') ? _.map(userFolders, 'id') : userFolders;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.userFolders + '/bulk',
                data: bulkIds
            }).then(function (result) {
                return generator.getBulkActionResponse(result, userFolders, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following', 'id');
            });
        };

        /**
         * @description Get User Folder by userFolderId
         * @param userFolderId
         * @returns {UserFolder|undefined} return UserFolder Model or undefined if not found.
         */
        self.getUserFolderById = function (userFolderId) {
            userFolderId = userFolderId instanceof UserFolder ? userFolderId.id : userFolderId;
            return _.find(self.userFolders, function (userFolder) {
                return Number(userFolder.id) === Number(userFolderId)
            });
        };

        /**
         * @description Activate User Folder
         * @param userFolder
         */
        self.activateUserFolder = function (userFolder) {
            return $http
                .put((urlService.userFolders + '/activate/' + userFolder.id))
                .then(function () {
                    return userFolder;
                });
        };

        /**
         * @description Deactivate User Folder
         * @param userFolder
         */
        self.deactivateUserFolder = function (userFolder) {
            return $http
                .put((urlService.userFolders + '/deactivate/' + userFolder.id))
                .then(function () {
                    return userFolder;
                });
        };

        /**
         * @description Activate bulk of User Folders
         * @param userFolders
         */
        self.activateBulkUserFolders = function (userFolders) {
            var bulkIds = userFolders[0].hasOwnProperty('id') ? _.map(userFolders, 'id') : userFolders;
            return $http
                .put((urlService.userFolders + '/activate/bulk'), bulkIds)
                .then(function () {
                    return userFolders;
                });
        };

        /**
         * @description Deactivate bulk of User Folders
         * @param userFolders
         */
        self.deactivateBulkUserFolders = function (userFolders) {
            var bulkIds = userFolders[0].hasOwnProperty('id') ? _.map(userFolders, 'id') : userFolders;
            return $http
                .put((urlService.userFolders + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return userFolders;
                });
        };

        /**
         * @description Add the single item to folder
         */
        self.singleAddToFolder = function (itemToAdd, folderId) {
            var model = {
                "first": folderId,
                "second": itemToAdd
            };
            return $http
                .put((urlService.userInbox + '/folder'), model)
                .then(function (result) {
                    return result.data.rs[itemToAdd[0]];
                });
        };

        /**
         * @description Add the bulk items to folder
         */
        self.bulkAddToFolder = function (itemsToAdd, folderId) {
            var model = {
                "first": folderId,
                "second": itemsToAdd
            };

            return $http
                .put((urlService.userInbox + '/folder'), model)
                .then(function (result) {
                    result = result.data.rs;
                    var failedItems = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedItems.push(key);
                    });
                    return _.filter(itemsToAdd, function (item) {
                        return (failedItems.indexOf(item) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param userFolder
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateUserFolder = function (userFolder, editMode) {
            var userFoldersToFilter = angular.copy(self.userFolders);
            if (editMode) {
                userFoldersToFilter = _.filter(userFoldersToFilter, function (userFolderToFilter) {
                    return userFolderToFilter.id !== userFolder.id;
                });
            }
            return _.some(_.map(userFoldersToFilter, function (existingUserFolder) {
                // if existing folder doesn't have name, change them to empty strings
                existingUserFolder.arName = existingUserFolder.arName ? existingUserFolder.arName : '';
                existingUserFolder.enName = existingUserFolder.enName ? existingUserFolder.enName : '';

                // if folder has arName and enName, check them
                if (userFolder.arName && userFolder.enName) {
                    return existingUserFolder.arName === userFolder.arName
                        || existingUserFolder.enName.toLowerCase() === userFolder.enName.toLowerCase();
                }
                else if (!userFolder.arName && userFolder.enName) {
                    return existingUserFolder.enName.toLowerCase() === userFolder.enName.toLowerCase();
                }
                else if (userFolder.arName && !userFolder.enName)
                    return existingUserFolder.arName === userFolder.arName;

            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteUserFolder, self.updateUserFolder);
    });
};
