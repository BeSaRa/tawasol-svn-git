module.exports = function (app) {
    app.service('followUpUserService', function ($http, $q, employeeService, FollowupBook, toast, cmsTemplate, _, urlService, dialog, FollowUpFolder, generator, langService) {
        var self = this;
        self.serviceName = 'followUpUserService';
        self.allFollowUpFolders = [];
        /**
         * @description prepare follow up for correspondence
         * @param correspondence
         * @returns {*}
         */
        self.prepareFollowUp = function (correspondence) {
            var info = correspondence.getInfo();
            return $http
                .get(urlService.prepareFollowUp.change({
                    vsId: info.vsId,
                    classKey: generator.getDocumentClassName(info.documentClass, true)
                }))
                .then(function (result) {
                    return generator.generateInstance(result.data.rs, FollowupBook);
                });
        };
        /**
         * @description add follow up for document
         * @param followUpData
         * @returns {Promise}
         */
        self.saveUserFollowUp = function (followUpData) {
            return $http
                .post(urlService.userFollowUp, followUpData);
        };
        /**
         * @description delete follow up folder
         * @param followUpFolder
         * @returns {Promise}
         */
        self.deleteFollowUpFolder = function (followUpFolder) {
            var id = followUpFolder.hasOwnProperty('id') ? followUpFolder.id : followUpFolder;
            return $http.delete((urlService.followUpFolders + '/' + id));
        };
        /**
         * @description delete bulk follow up folders
         * @param followUpFolders
         * @returns {*}
         */
        self.deleteBulkFollowUpFolders = function (followUpFolders) {
            var bulkIds = followUpFolders[0].hasOwnProperty('id') ? _.map(followUpFolders, 'id') : followUpFolders;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.followUpFolders + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedFollowUpFolders = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedFollowUpFolders.push(key);
                });
                return _.filter(followUpFolders, function (item) {
                    return (failedFollowUpFolders.indexOf(item.id) > -1);
                });
            });
        };
        /**
         * @description Add new User Folder
         * @return {Promise|FollowUpFolder}
         * @param followUpFolder
         */
        self.addFollowUpFolder = function (followUpFolder) {
            return $http
                .post(urlService.followUpFolders,
                    generator.interceptSendInstance('FollowUpFolder', followUpFolder))
                .then(function (result) {
                    return generator.interceptReceivedInstance('FollowUpFolder', generator.generateInstance(result.data.rs, FollowUpFolder, self._sharedMethods));
                });
        };
        /**
         * @description Update the given User Folder.
         * @return {Promise|FollowUpFolder}
         * @param followUpFolder
         */
        self.updateFollowUpFolder = function (followUpFolder) {
            return $http
                .put(urlService.followUpFolders,
                    generator.interceptSendInstance('FollowUpFolder', followUpFolder))
                .then(function () {
                    return generator.interceptReceivedInstance('FollowUpFolder', generator.generateInstance(followUpFolder, FollowUpFolder));
                });
        };
        /**
         * @description Contains methods for CRUD operations for User Folders
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new User Folder
             * @param followupFolder
             * @param $event
             */
            followupFolderAdd: function (followupFolder, $event) {
                var parentFolder = angular.copy(followupFolder);
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('followup-folder'),
                        controller: 'followupFolderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            followupFolder: new FollowUpFolder(
                                {
                                    ouId: employeeService.getEmployee().getOUID(),
                                    userId: employeeService.getEmployee().id,
                                    parent: followupFolder ? followupFolder.id : null
                                }),
                            parent: parentFolder
                        }
                    });
            },
            /**
             * @description Opens popup to edit User Folder
             * @param followupFolder
             * @param $event
             */
            followupFolderEdit: function (followupFolder, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('followup-folder'),
                        controller: 'followupFolderPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            followupFolder: followupFolder,
                            parent: null
                        }
                    });
            },
            /**
             * @description Show confirm box and delete User Folder
             * @param followupFolder
             * @param $event
             */
            followupFolderDelete: function (followupFolder, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: followupFolder.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteFollowUpFolder(followupFolder).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: followupFolder.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk User Folders
             * @param followupFolders
             * @param $event
             */
            followupFolderDeleteBulk: function (followupFolders, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_folder_subfolder'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkFollowUpFolders(followupFolders)
                            .then(function (result) {
                                var response = false;
                                if (result.length === followupFolders.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (followupFolder) {
                                        return followupFolder.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };
        /**
         * @description open dialog for adding the document to follow up.
         * @param correspondence
         * @returns {promise}
         */
        self.addCorrespondenceToMyFollowUp = function (correspondence) {
            var defer = $q.defer();
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('add-follow-up'),
                controller: 'followUpPopCtrl',
                controllerAs: 'ctrl',
                resolve: {
                    folders: function () {
                        'ngInject';
                        return self.getFollowupFolders().then(function (folders) {
                            defer.resolve(folders);
                            return folders;
                        });
                    },
                    followUpData: function () {
                        'ngInject';
                        return defer.promise.then(function (folders) {
                            return self.prepareFollowUp(correspondence).then(function (data) {
                                folders && folders.length > 0 ? data.folderId = folders[0].id : null;
                                data.followupDate = data.followupDate ? generator.getDateObjectFromTimeStamp(data.followupDate) : null;
                                return data;
                            });
                        });
                    }
                }
            })
        };
        /**
         * return folders hierarchy
         * @param collection
         * @returns {FollowUpFolder[]}
         */
        self.hierarchy = function (collection) {
            var list = angular.copy(collection);
            var children = {};
            var parents = [];

            function _separation(list) {
                _.map(list, function (item) {
                    item.status = true;
                    if (item.parent) {
                        !children.hasOwnProperty(item.parent) ? children[item.parent] = [] : null;
                        children[item.parent].push(item);
                    } else {
                        parents.push(item);
                    }
                });
            }

            function _getChildren(parent) {
                if (children.hasOwnProperty(parent.id)) {
                    parent.children = children[parent.id];
                    parent.children.length ? parent.children.forEach(_getChildren) : null;
                } else {
                    parent.children = [];
                }

            }

            _separation(list);
            _.map(parents, function (item) {
                _getChildren(item);
            });
            return parents;
        }
        /**
         * @description get followup folders for current user.
         */
        self.getFollowupFolders = function (hierarchy) {
            return $http.get(urlService.followUpFolders)
                .then(function (result) {
                    self.allFollowUpFolders = generator.generateCollection(result.data.rs, FollowUpFolder);
                    return hierarchy ? self.hierarchy(self.allFollowUpFolders) : self.allFollowUpFolders;
                });
        };

        self.loadFollowupFolderContent = function (folder) {
            var id = folder.hasOwnProperty('id') ? folder.id : folder;
            return $http.get(urlService.followUpFolders + '/' + id)
                .then(function (result) {
                    return generator.generateCollection(result.data.rs, FollowupBook);
                });
        }


    });
};
