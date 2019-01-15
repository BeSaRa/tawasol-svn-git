module.exports = function (app) {
    app.service('moveToFolderService', function (urlService,
                                                 $http,
                                                 $q,
                                                 generator,
                                                 UserFolder,
                                                 MoveToFolder,
                                                 _,
                                                 dialog,
                                                 langService,
                                                 toast,
                                                 cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'moveToFolderService';

        self.moveToFolders = [];
        self.workItems = [];

        /**
         * @description Load the Folders from server.
         * @returns {Promise|moveToFolders}
         */
        self.loadMoveToFolders = function () {
            return $http.get(urlService.userFolders).then(function (result) {
                self.moveToFolders = generator.generateCollection(result.data.rs, MoveToFolder, self._sharedMethods);
                self.moveToFolders = generator.interceptReceivedCollection('MoveToFolder', self.moveToFolders);

                self.moveToFolders = _.map(self.moveToFolders, function (folder) {
                    var isRecordExist = _.filter(self.workItems, function (workItem, key, value) {
                        return Number(key) === folder.id;
                    })[0];

                    if (isRecordExist && isRecordExist.length > 0) {
                        isRecordExist = _.map(isRecordExist, function (record) {
                            // record.isWorkItem = true;
                            return record;
                        });

                        folder.workItems = isRecordExist;
                        /*if (!folder.hasOwnProperty('children'))
                            folder.children = [];
                        folder.children.push(isRecordExist);*/
                        //folder.isWorkItem = true;
                    }
                    return folder;
                });
                return self.moveToFolders;
            });
        };

        /**
         * @description Get Folders from self.moveToFolders if found and if not load it from server again.
         * @returns {Promise|moveToFolders}
         */
        self.getMoveToFolders = function () {
            return self.moveToFolders.length ? $q.when(self.moveToFolders) : self.loadMoveToFolders();
        };

        self.getAllFolders = function () {
            return self.loadWorkItemsMoveToFolders().then(function () {
                return self.loadMoveToFolders()
                    .then(function (result) {
                        self.moveToFolders = self.getNestedParentChildrenFolders(result);
                        return self.moveToFolders;
                    });
            });
        };

        self.loadWorkItemsMoveToFolders = function () {
            return $http.get(urlService.userInbox + "/all-folder").then(function (result) {
                self.workItems = result.data.rs;
                return self.workItems;
            });
        };

        /**
         * @description convert array to nested parent child for treeview
         * @returns {Array}
         */
        self.getNestedParentChildrenFolders = function (userFolders) {
            return self.separateParentFromChildren(userFolders).getChildrenForParents(self.moveToFolders);
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
            self.moveToFolders = [];
            self.childrenFolders = {};
            _.map(userFolders, function (folder) {
                if (!folder.parent) {
                    self.moveToFolders.push(folder);
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
         * @description Contains methods for CRUD operations for Folders
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new Folder
             * @param $event
             */
            moveToFolder: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('move-to-folder'),
                        controller: 'moveToFolderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {},
                        resolve: {
                            moveToFolders: function (moveToFolderService) {
                                'ngInject';
                                return moveToFolderService.getAllFolders()
                                    .then(function (result) {
                                        return result;
                                    });
                            }
                        }
                    });
            }
        };

        /**
         * @description Add new Folder
         * @param moveToFolder
         * @return {Promise|MoveToFolder}
         */
        self.addMoveToFolder = function (moveToFolder) {
            return $http
                .post(urlService.moveToFolders,
                    generator.interceptSendInstance('MoveToFolder', moveToFolder))
                .then(function (result) {
                    return generator.interceptReceivedInstance('MoveToFolder', generator.generateInstance(result.data.rs, MoveToFolder, self._sharedMethods));
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteMoveToFolder, self.updateMoveToFolder);
    });
};
