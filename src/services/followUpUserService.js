module.exports = function (app) {
    app.service('followUpUserService', function ($http,
                                                 $q,
                                                 employeeService,
                                                 FollowupBook,
                                                 toast,
                                                 cmsTemplate,
                                                 _,
                                                 helper,
                                                 urlService,
                                                 printService,
                                                 dialog,
                                                 FollowUpFolder,
                                                 UserFollowupBookMulti,
                                                 generator,
                                                 moment,
                                                 langService,
                                                 errorCode,
                                                 tokenService,
                                                 dynamicFollowupService,
                                                 ReassignFollowup,
                                                 PersonalFollowupStatistics,
                                                 EmployeeFollowupStatistics,
                                                 FollowupBookCriteria) {
            var self = this;
            self.serviceName = 'followUpUserService';
            self.allFollowUpFolders = [];
            self.printPage = "views/print/UserFollowupPrint.html";

            /**
             * @description bulk message for any bulk actions.
             * @param result
             * @param collection
             * @param ignoreMessage
             * @param errorMessage
             * @param successMessage
             * @param failureSomeMessage
             * @returns {*}
             * @private
             */
            function _bulkMessages(result, collection, ignoreMessage, errorMessage, successMessage, failureSomeMessage) {
                var failureCollection = [];
                var currentIndex = 0;
                _.map(result.data.rs, function (value) {
                    if (!value)
                        failureCollection.push(collection[currentIndex]);
                    currentIndex++;
                });
                if (!ignoreMessage) {
                    if (failureCollection.length === collection.length) {
                        toast.error(langService.get(errorMessage));
                    } else if (failureCollection.length) {
                        generator.generateFailedBulkActionRecords(failureSomeMessage, _.map(failureCollection, function (item) {
                            return item.getTranslatedName();
                        }));
                    } else {
                        toast.success(langService.get(successMessage));
                    }
                }
                return collection;
            }

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
                        return generator.interceptReceivedInstance('FollowupBook', generator.generateInstance(result.data.rs, FollowupBook));
                    });
            };
            /**
             * @description add follow up for document
             * @param followUpData
             * @returns {Promise}
             */
            self.saveUserFollowUp = function (followUpData) {
                return $http
                    .post(urlService.userFollowUp, followUpData)
                    .catch(function (error) {
                        return errorCode.showErrorDialog(error);
                    });
            };

            /**
             * @description add broadcast follow up for document
             * @param followUpData
             * @returns {Promise}
             */
            self.saveBroadcastFollowup = function (followUpData) {
                var data = new UserFollowupBookMulti({
                    vsId: followUpData.vsId,
                    docClassId: followUpData.docClassId,
                    followupDate: followUpData.followupDate,
                    userList: followUpData.userList
                });
                return $http
                    .post(urlService.userFollowUp + '/broadcast-followup', generator.interceptSendInstance('UserFollowupBookMulti', data))
                    .catch(function (error) {
                        return errorCode.showErrorDialog(error);
                    });
            }

            /**
             * @description add follow up for document
             * @param followUpData
             * @returns {Promise}
             */
            self.updateUserFollowUp = function (followUpData) {
                return $http
                    .put(urlService.userFollowUp, followUpData)
                    .catch(function (error) {
                        return errorCode.showErrorDialog(error);
                    });
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
                 * @param folders
                 */
                followupFolderAdd: function (followupFolder, $event, folders) {
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
                                        parent: followupFolder ? followupFolder.id : null,
                                        isDefault: !folders.length
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
                },
                /**
                 * @description Opens the filter dialog
                 * @param grid
                 * @param searchCriteria
                 * @param isAdminFollowup
                 * @param $event
                 * @returns {promise}
                 */
                openFilterDialog: function (grid, searchCriteria, isAdminFollowup, $event) {
                    return dialog
                        .showDialog({
                            targetEvent: $event || null,
                            templateUrl: cmsTemplate.getPopup('followup-book-search'),
                            controller: 'followupBookSearchPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                searchCriteria: searchCriteria,
                                grid: grid,
                                isAdminFollowup: isAdminFollowup
                            },
                            resolve: {
                                correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                                    'ngInject';
                                    return correspondenceSiteTypeService.getCorrespondenceSiteTypes();
                                },
                                folders: function (employeeService) {
                                    'ngInject';
                                    return isAdminFollowup ? [] : self.loadFollowupFoldersByOuAndUser(employeeService.getEmployee().getRegistryOUID(), employeeService.getEmployee().id);
                                }
                            }
                        });
                }
            };

            /**
             * @description Opens dialog to move terminated books to other folder
             * @param folderId
             * @param skipFolderIds
             * @param $event
             */
            self.openMoveTerminatedBooksDialog = function (folderId, skipFolderIds, $event) {
                folderId = angular.copy(generator.getNormalizedValue(folderId, 'id'));
                var employee = employeeService.getEmployee(),
                    ouApplicationUser = employeeService.getCurrentOUApplicationUser(),
                    userId = ouApplicationUser.applicationUser.hasOwnProperty('id') ? ouApplicationUser.applicationUser.id : ouApplicationUser.applicationUser,
                    employeeOuId = (employee.organization.ouid && employee.organization.ouid.hasOwnProperty('id')) ? employee.organization.ouid.id : employee.organization.ouid;

                self.getTerminatedBooksByUserAndFolder(userId, employeeOuId, folderId)
                    .then(function (result) {
                        if (result && result.length) {
                            self.showAddBulkFollowupBooksToFolder(result, false, $event, folderId)
                                .then(function () {

                                });
                        }
                    })

            };

            /**
             * @description Gets the terminated followup books by userId, ouId, folderId
             * @param userId
             * @param ouId
             * @param folderId
             * @returns {*}
             */
            self.getTerminatedBooksByUserAndFolder = function (userId, ouId, folderId) {
                var searchCriteria = new FollowupBookCriteria({
                    userId: userId,
                    userOUID: ouId,
                    status: false,
                    folderId: folderId
                });
                return self.loadUserFollowupBooksByCriteria(null, searchCriteria);
            };

            /**
             * @description open dialog for adding the document to follow up.
             * @param correspondence
             * @param editMode
             * @returns {promise}
             */
            self.addCorrespondenceToMyFollowUp = function (correspondence, editMode) {
                var defer = $q.defer();
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('add-follow-up'),
                    controller: 'followUpPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        addToMyFollowup: true,
                        followUpOrganizations: [], // used for add to other user followup only
                        editMode: editMode
                    },
                    resolve: {
                        folders: function () {
                            'ngInject';
                            return self.loadFollowupFolders().then(function (folders) {
                                defer.resolve(folders);
                                return folders;
                            });
                        },
                        followUpData: function () {
                            'ngInject';
                            if (editMode) {
                                var data = angular.copy(correspondence);
                                data.followupDate = data.followupDate ? generator.getDateObjectFromTimeStamp(data.followupDate) : null;

                                return data;
                            } else {
                                return defer.promise.then(function (folders) {
                                    return self.prepareFollowUp(correspondence).then(function (data) {
                                        folders && folders.length > 0 ? data.folderId = folders[0].id : null;
                                        data.followupDate = data.followupDate ? generator.getDateObjectFromTimeStamp(data.followupDate) : null;
                                        return data;
                                    });
                                });
                            }
                        },
                        organizationForSLA: function (employeeService, organizationService) {
                            'ngInject';
                            var ou = employeeService.getEmployee().userOrganization;
                            if (ou.hasRegistry) {
                                return ou;
                            }
                            return organizationService.loadOrganizationById(ou.getRegistryOUID());
                        }
                    }
                })
            };

            /**
             * @description open dialog for adding the document to follow up of other employee.
             * @param correspondence
             * @param editMode
             * @returns {promise}
             */
            self.addCorrespondenceToEmployeeFollowUp = function (correspondence, editMode) {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('add-follow-up'),
                    controller: 'followUpPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        addToMyFollowup: false,
                        folders: [], // folders is empty because they will be fetched from user
                        editMode: editMode
                    },
                    resolve: {
                        followUpOrganizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getFollowUpOrganizations();
                        },
                        followUpData: function () {
                            'ngInject';
                            if (editMode) {
                                var data = angular.copy(correspondence);
                                data.followupDate = data.followupDate ? generator.getDateObjectFromTimeStamp(data.followupDate) : null;

                                return data;
                            } else {
                                return self.prepareFollowUp(correspondence).then(function (data) {
                                    // no need to set folder as folder will be set from ouApplicationUser
                                    //folders && folders.length > 0 ? data.folderId = folders[0].id : null;

                                    data.folderId = null;
                                    data.followupDate = data.followupDate ? generator.getDateObjectFromTimeStamp(data.followupDate) : null;
                                    return data;

                                });
                            }
                        },
                        organizationForSLA: function (employeeService, organizationService) {
                            'ngInject';
                            var ou = employeeService.getEmployee().userOrganization;
                            if (ou.hasRegistry) {
                                return ou;
                            }
                            return organizationService.loadOrganizationById(ou.getRegistryOUID());
                        }
                    }
                })
            };

            /**
             * @description open dialog for adding the document to broadcast follow up.
             * @param correspondence
             * @returns {promise}
             */
            self.addCorrespondenceToBroadcastFollowUp = function (correspondence) {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('add-broadcast-follow-up'),
                    controller: 'broadcastFollowUpPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        addToMyFollowup: false
                    },
                    resolve: {
                        followUpOrganizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getFollowUpOrganizations();
                        },
                        followUpData: function () {
                            'ngInject';
                            return self.prepareFollowUp(correspondence).then(function (data) {
                                data.followupDate = data.followupDate ? generator.getDateObjectFromTimeStamp(data.followupDate) : null;
                                return data;
                            });

                        },
                        organizationForSLA: function (employeeService, organizationService) {
                            'ngInject';
                            var ou = employeeService.getEmployee().userOrganization;
                            if (ou.hasRegistry) {
                                return ou;
                            }
                            return organizationService.loadOrganizationById(ou.getRegistryOUID());
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
                        //item.status = true;
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
            };

            /**
             * @description loads followup folders for current user.
             */
            self.loadFollowupFolders = function (hierarchy) {
                return $http.get(urlService.followUpFolders)
                    .then(function (result) {
                        self.allFollowUpFolders = generator.generateCollection(result.data.rs, FollowUpFolder);
                        return hierarchy ? self.hierarchy(self.allFollowUpFolders) : self.allFollowUpFolders;
                    });
            };

            /**
             * @description get followup folders for current user.
             */
            self.getFollowupFolders = function (hierarchy) {
                if (self.allFollowUpFolders.length) {
                    return hierarchy ? $q.when(self.hierarchy(self.allFollowUpFolders)) : $q.when(self.allFollowUpFolders);
                }
                return self.loadFollowupFolders(hierarchy);
            };

            /**
             * @description Get the followup folder by id
             * @param folderId
             * @returns {*}
             */
            self.getFollowupFolderById = function (folderId) {
                folderId = generator.getNormalizedValue(folderId, 'id');
                return _.find(self.allFollowUpFolders, function (folder) {
                    return folder.id === folderId;
                })
            };

            /**
             * @description Loads the followup folders by ouId and userId
             * @param ouId
             * @param userId
             * @param hierarchy
             * @returns {*}
             */
            self.loadFollowupFoldersByOuAndUser = function (ouId, userId, hierarchy) {
                ouId = generator.getNormalizedValue(ouId, 'id');
                userId = generator.getNormalizedValue(userId, 'id');
                return $http.get(urlService.followUpFolders + '/user-id/' + userId + '/ou-id/' + ouId)
                    .then(function (result) {
                        var folders = generator.generateCollection(result.data.rs, FollowUpFolder);
                        return hierarchy ? self.hierarchy(folders) : folders;
                    });
            };

            /**
             * @description Loads the records for given followup folder
             * @param folder
             * @returns {*}
             */
            self.loadFollowupFolderContent = function (folder) {
                var id = folder.hasOwnProperty('id') ? folder.id : folder;
                return $http.get(urlService.followUpFolders + '/' + id)
                    .then(function (result) {
                        return generator.interceptReceivedCollection('FollowupBook', generator.generateCollection(result.data.rs, FollowupBook));
                    });
            };

            /**
             * @description Loads the user followup book records by criteria
             * @param searchText
             * @param searchCriteria
             * @returns {*}
             */
            self.loadUserFollowupBooksByCriteria = function (searchText, searchCriteria) {
                if (searchText && !searchCriteria) {
                    searchCriteria = new FollowupBookCriteria({
                        docSubject: searchText
                    });
                }

                return $http.post(urlService.userFollowUp + '/search', generator.interceptSendInstance('FollowupBookCriteria', searchCriteria))
                    .then(function (result) {
                        return generator.interceptReceivedCollection('FollowupBook', generator.generateCollection(result.data.rs, FollowupBook));
                    });
            };

            /**
             * @description load user followup books by stats used in dashboard
             * @param user
             * @param organization
             * @returns {*}
             */
            self.loadUserFollowupBooksByStats = function (user, organization) {
                var userId = user.hasOwnProperty('id') ? user.id : user;
                var ouId = organization.hasOwnProperty('id') ? organization.id : organization;
                return $http.get(urlService.userFollowUp + '/user-followup-stats/user?followeeUserId=' + userId + '&followeeOuId=' + ouId)
                    .then(function (result) {
                        return generator.interceptReceivedCollection('FollowupBook', generator.generateCollection(result.data.rs, FollowupBook));
                    });
            }

            /**
             * @description  open reason dialog
             * @param dialogTitle
             * @param $event
             * @param saveButtonKey
             * @param reasonText
             * @param allowedMaxLength
             * @returns {promise|*}
             */
            self.showReasonDialog = function (dialogTitle, $event, saveButtonKey, reasonText, allowedMaxLength) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('reason'),
                        controller: 'reasonPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        targetEvent: $event,
                        locals: {
                            title: dialogTitle,
                            saveButtonKey: saveButtonKey,
                            reasonText: reasonText || '',
                            allowedMaxLength: allowedMaxLength || 200
                        },
                        resolve: {
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    });
            };
            /**
             * @description open bulk reason.
             * @param dialogTitle
             * @param followupBooks
             * @param $event
             * @param allowedMaxLength
             */
            self.showReasonBulkDialog = function (dialogTitle, followupBooks, $event, allowedMaxLength) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('reason-bulk'),
                        controller: 'reasonBulkPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        bindToController: true,
                        locals: {
                            workItems: followupBooks,
                            title: dialogTitle,
                            allowedMaxLength: allowedMaxLength || 200
                        },
                        resolve: {
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    });
            };

            self.terminateFollowup = function (followUpBook, terminateAsBulk, $event, ignoreMessage) {
                return self.showReasonDialog('terminate_reason', $event)
                    .then(function (reason) {
                        return $http
                            .put(urlService.userFollowUp + "/terminate", {
                                id: followUpBook.id,
                                comment: reason,
                                terminateAsBulk: terminateAsBulk
                            })
                            .then(function () {
                                if (!ignoreMessage) {
                                    toast.success(langService.get("terminate_specific_success").change({name: followUpBook.docSubject}));
                                }
                                return followUpBook;
                            });
                    });
            };

            /**
             * @description terminate bulk followupBooks.
             * @param followupBooks
             * @param $event
             * @param ignoreMessage
             * @returns {*}
             */
            self.terminateBulkFollowup = function (followupBooks, $event, ignoreMessage) {

                // if the selected workItem has just one record.
                if (followupBooks.length === 1)
                    return self.terminateFollowup(followupBooks[0], $event);
                return self
                    .showReasonBulkDialog('terminate_reason', followupBooks, $event)
                    .then(function (followupBooks) {
                        var items = _.map(followupBooks, function (followupBook) {
                            return {
                                id: followupBook.id,
                                comment: followupBook.reason
                            };
                        });
                        return $http
                            .put(urlService.userFollowUp + "/terminate/bulk", items)
                            .then(function (result) {
                                return _bulkMessages(result, followupBooks, ignoreMessage, 'failed_terminate_selected', 'selected_terminate_success', 'following_records_failed_to_terminate');
                            });
                    })
            };

            /**
             * @description Opens dialog to enter email address
             * @param record
             * @param receivingUser
             * @param $event
             * @returns {promise}
             * @private
             */
            function _openSendEmailDialog(record, receivingUser, $event) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('email'),
                        controllerAs: 'ctrl',
                        eventTarget: $event || null,
                        bindToController: true,
                        controller: function (record, emailAddress, dialog) {
                            'ngInject';
                            var self = this;
                            self.record = record;
                            self.emailAddress = angular.copy(emailAddress);

                            self.sendEmail = function (form, $event) {
                                if (form.$invalid) {
                                    return;
                                }
                                dialog.hide(self.emailAddress);
                            };

                            self.closePopup = function () {
                                dialog.cancel();
                            };
                        },
                        locals: {
                            record: record
                        },
                        resolve: {
                            emailAddress: function (applicationUserService) {
                                'ngInject';
                                if (!receivingUser) {
                                    return null;
                                }
                                if (employeeService.isCurrentApplicationUser(receivingUser)) {
                                    return generator.getNormalizedValue(receivingUser, 'email');
                                }

                                return applicationUserService.loadApplicationUserById(receivingUser)
                                    .then(function (appUser) {
                                        return (!!appUser ? generator.getNormalizedValue(appUser, 'email') : null);
                                    });
                            }
                        }
                    })
            }

            /**
             * @description Send reminder email
             * @param correspondence
             * @param receivingUser
             * @param $event
             * @returns {promise}
             */
            self.sendReminderEmail = function (correspondence, receivingUser, $event) {
                var info = correspondence.getInfo(),
                    defer = $q.defer();

                _openSendEmailDialog(correspondence, receivingUser, $event)
                    .then(function (email) {
                        defer.resolve(email);
                    })
                    .catch(function (error) {
                        defer.reject(false);
                    });
                return defer.promise.then(function (email) {
                    return $http.put(urlService.userFollowUp + '/send-remainder/' + info.id + '/user-email?email=' + email, {})
                        .then(function (result) {
                            if (result.data.rs) {
                                toast.success(langService.get('email_success'));
                            }
                            return result.data.rs;
                        });
                });
            };

            /**
             * @description dialog to enter report subject when filtering
             * @returns {*}
             */
            self.setFollowupReportHeading = function (searchCriteriaUsed, searchCriteria, selected) {
                var creationDate = moment(new Date()).format('YYYY-MM-DD');
                var heading = {
                    subject: {
                        header: langService.get('followup_report'),
                        value: self.reportSubject
                    },
                    byUser: {
                        header: langService.get('created_by'),
                        value: employeeService.getEmployee().getTranslatedName()
                    },
                    creationDate: {header: langService.get('created_on'), value: creationDate}
                };


                if (!searchCriteriaUsed) {
                    var defer = $q.defer();
                    heading.subject.value = selected;
                    defer.resolve(heading);

                    return defer.promise;
                } else {
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('followup-report-subject'),
                        bindToController: true,
                        controller: function () {
                            'ngInject';
                            var self = this;
                            self.reportSubject = '';
                            self.submitSubject = function () {
                                heading.subject.value = self.reportSubject;
                                dialog.hide(heading);
                            }
                        },
                        controllerAs: 'ctrl'
                    });
                }
            };

            self.printUserFollowup = function (heading, recordsCriteria) {
                var buttonsList = [
                    printService.printButtonTypes.pdf,
                    printService.printButtonTypes.excel,
                    printService.printButtonTypes.word
                ];
                dialog.confirmMessageWithDynamicButtonsList(langService.get('select_file_type_to_print_download'), buttonsList, '')
                    .then(function (exportOption) {
                        recordsCriteria.forPrinting = true;
                        var errorMessage = langService.get('error_export_to_file').change({format: exportOption.text}),
                            printCriteria = {
                                criteria: generator.interceptSendInstance('FollowupBookCriteria', recordsCriteria),
                                reportTitle: heading.subject.value,
                                exportType: exportOption.type
                            };

                        $http.post(urlService.userFollowUp + '/print', printCriteria)
                            .then(function (result) {
                                var physicalPath = result.data.rs;
                                if (!physicalPath) {
                                    toast.error(errorMessage);
                                    return $q.reject(errorMessage)
                                } else {
                                    return $http.get(physicalPath, {
                                        responseType: 'blob'
                                    }).then(function (result) {
                                        return {
                                            url: window.URL.createObjectURL(result.data),
                                            blob: result.data,
                                            physicalPath: physicalPath
                                        };
                                    });
                                }
                            })
                            .then(function (file) {
                                var oldIframe = document.getElementById('iframe-print');
                                oldIframe ? oldIframe.parentNode.removeChild(oldIframe) : null;

                                if (exportOption.type === 'excel') {
                                    window.open(file.physicalPath, '_blank');
                                    return;
                                }

                                if (helper.browser.isIE()) {
                                    window.navigator.msSaveOrOpenBlob(file.blob);
                                } else if (helper.browser.isFirefox()) {
                                    window.open(file.physicalPath, '_blank');
                                } else {
                                    var iframe = document.createElement('iframe');
                                    iframe.id = 'iframe-print';
                                    iframe.onload = function (ev) {
                                        iframe.contentWindow.focus();
                                        iframe.contentWindow.print();

                                    };
                                    iframe.src = file.url;
                                    document.body.appendChild(iframe);
                                }
                            })
                            .catch(function () {
                                toast.error(errorMessage);
                            });
                    });
            }

            self.printUserFollowup1 = function (heading, criteria) {
                dialog.confirmThreeButtonMessage(langService.get('select_file_type_to_print_download'), '', langService.get('web_print'), 'WORD')
                    .then(function (confirmResult) {
                        criteria.forPrinting = true;
                        $http.post(urlService.userFollowUp + '/print', generator.interceptSendInstance('FollowupBookCriteria', criteria))
                            .then(result => {
                                var preparePrint = {
                                    token: tokenService.getToken(),
                                    url: urlService.exportToWord,
                                    isWordPrinting: confirmResult.button === 2 ? "true" : "false"
                                };
                                localStorage.setItem('preparePrint', JSON.stringify(preparePrint));

                                var exportData = _getExportData(heading,
                                    generator.interceptReceivedCollection('FollowupBook', generator.generateCollection(result.data.rs, FollowupBook))
                                );


                                if (!exportData.headerNames.length) {
                                    toast.info(langService.get('no_data_to_print'));
                                } else {
                                    localStorage.setItem('userFollowupData', JSON.stringify(exportData));
                                    localStorage.setItem('currentLang', langService.current);
                                    var printWindow = window.open(self.printPage, '', 'left=0,top=0,width=0,height=0,toolbar=0,scrollbars=0,status=0');
                                    printWindow.onafterprint = function () {
                                        printWindow.close();
                                    };
                                    if (!printWindow) {
                                        toast.error(langService.get('msg_error_occurred_while_processing_request'))
                                    }
                                }
                            })
                    });
            }

            var _getExportData = function (heading, userFollowups) {
                var headerNames = [],
                    data = [],
                    i, record;
                if (userFollowups && userFollowups.length) {
                    headerNames = [
                        langService.get('inbox_serial'),
                        langService.get('correspondence_sites'),
                        langService.get('document_number'),
                        langService.get('subject'),
                        langService.get('priority_level'),
                        langService.get('followup_date'),
                        langService.get('type'),
                        langService.get('document_date'),
                        langService.get('comment'),
                        langService.get('number_of_days')
                    ];
                    for (i = 0; i < userFollowups.length; i++) {
                        record = userFollowups[i];
                        data.push([
                            record.docFullSerial,
                            record.getTranslatedCorrespondenceSiteInfo(),
                            record.refDocNumber,
                            record.docSubject,
                            record.priorityLevelLookup.getTranslatedName(),
                            record.followupDateString,
                            langService.get(record.docClassIndicator.tooltip),
                            record.docDateString,
                            _.map(record.commentList, function (comment) {

                                return comment.description + ' ' + langService.get('created_on') + ' ' + generator.getDateFromTimeStamp(comment.creationDate)
                                    + ' ' + langService.get('created_by') + ' ' + comment.createorInfo.getTranslatedName();
                            }),
                            record.numberOfDays
                        ]);
                    }
                }
                return {
                    headerText: heading,
                    headerNames: headerNames,
                    data: data
                };
            };

            /**
             * @description show folder dialog
             * @param records
             * @param folders
             * @param showRoot
             * @param $event
             * @returns {promise|*}
             */
            self.showFolderDialog = function (records, folders, showRoot, $event) {
                records = angular.isArray(records) ? records : [records];
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('followup-folder-tree'),
                        controller: 'followupFolderTreePopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event || null,
                        locals: {
                            folders: folders,
                            records: records,
                            showRoot: showRoot
                        }
                    });
            };

            /**
             * @description add followup book to folder
             * @param record
             * @param showRoot
             * @param $event
             * @returns {promise|*}
             */
            self.showAddFollowupBookToFolder = function (record, showRoot, $event) {
                var defer = $q.defer();
                self.getFollowupFolders(true)
                    .then(function (result) {
                        defer.resolve(result);
                    });
                return defer.promise.then(function (folders) {
                    if (!folders.length) {
                        toast.info(langService.get('no_folder_for_user'));
                        return false;
                    } else {
                        return self.showFolderDialog(record, folders, showRoot, $event);
                    }
                });
            };

            /**
             * @description add bulk followup books to folder.
             * @param records
             * @param showRoot
             * @param $event
             * @param skipParentFolderId
             * @returns {promise|*}
             */
            self.showAddBulkFollowupBooksToFolder = function (records, showRoot, $event, skipParentFolderId) {
                var defer = $q.defer();
                self.getFollowupFolders(true)
                    .then(function (result) {
                        if (skipParentFolderId) {
                            skipParentFolderId = generator.getNormalizedValue(skipParentFolderId, 'id');
                            result = _.filter(result, function (item) {
                                return item.id !== skipParentFolderId;
                            });
                        }
                        defer.resolve(result);
                    });
                return defer.promise.then(function (folders) {
                    if (!folders.length) {
                        toast.info(langService.get('no_folder_for_user'));
                        return false;
                    } else {
                        return self.showFolderDialog(records, folders, showRoot, $event);
                    }
                });
            };

            /**
             * @description the
             * @param records
             * @param folder
             * @returns {Promise}
             */
            self.commonAddToFolder = function (records, folder) {
                var ids = _.map(records, function (item) {
                    return item.getInfo().id;
                });
                return $http
                    .put(urlService.userFollowUp + '/folder/move/bulk/' + (folder.hasOwnProperty('id') ? folder.id : folder), ids)
                    .catch(function (error) {
                        return errorCode.showErrorDialog(error);
                    });
            };

            /**
             * @description add followup book to folder
             * @param records
             * @param folder
             * @param ignoreMessage
             * @returns {Promise<any>}
             */
            self.addFollowupBookToFolder = function (records, folder, ignoreMessage) {
                if (!folder.status || !folder.id) {
                    toast.error(langService.get('folder_deactivated'));
                    return $q.reject();
                }

                return self.commonAddToFolder(records, folder)
                    .then(function (result) {
                        var info = records[0].getInfo();
                        if (!ignoreMessage) {
                            if (result.data.rs[info.id]) {
                                toast.success(langService.get('inbox_add_to_folder_specific_success').change({
                                    name: info.title,
                                    folder: folder.getTranslatedName()
                                }));
                            } else {
                                toast.success(langService.get('inbox_failed_add_to_folder_selected'));
                            }
                        }
                        return records;
                    });
            };
            /**
             * @description add bulk followup books to folder
             * @param records
             * @param folder
             * @param ignoreMessage
             * @returns {Promise<any>}
             */
            self.addBulkFollowupBooksToFolder = function (records, folder, ignoreMessage) {
                if (records.length === 1)
                    return self.addFollowupBookToFolder(records, folder, ignoreMessage);
                return self.commonAddToFolder(records, folder)
                    .then(function (result) {
                        return _bulkMessages(result, records, ignoreMessage, 'inbox_failed_add_to_folder_selected', 'add_to_folder_success', 'add_to_folder_success_except_following');
                    });
            };

            /**
             * @description open transfer dialog to select user to transfer.
             * @param records
             * @param currentFollowedUpOu
             * @param currentFollowedUpUser
             * @param $event
             * @param allowedMaxLength
             */
            self.openTransferDialog = function (records, currentFollowedUpOu, currentFollowedUpUser, $event, allowedMaxLength) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('transfer-followup-book'),
                        controller: 'transferFollowupBookPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            records: records,
                            currentFollowedUpOu: currentFollowedUpOu,
                            currentFollowedUpUser: currentFollowedUpUser,
                            allowedMaxLength: allowedMaxLength || 200
                        },
                        resolve: {
                            followUpOrganizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getFollowUpOrganizations();
                            },
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    })
                    .then(function (records) {
                        var promise;
                        if (!angular.isArray(records)) {
                            promise = self.transferSingleFollowupBook(records);
                        } else {
                            promise = self.transferBulkFollowupBooks(records);
                        }
                        return promise;
                    });
            };

            /**
             * @description transfer single followup book.
             * @param userFollowupRequest
             */
            self.transferSingleFollowupBook = function (userFollowupRequest) {
                return $http
                    .put((urlService.userFollowUp + '/transfer'), generator.interceptSendInstance('UserFollowupRequest', userFollowupRequest))
                    .then(function (result) {
                        return result.data.rs;
                    })
                    .catch(function (error) {
                        return errorCode.showErrorDialog(error);
                    });
            };
            /**
             * @description transfer bulk followup books.
             * @param userFollowupRequests
             */
            self.transferBulkFollowupBooks = function (userFollowupRequests) {
                return $http
                    .put((urlService.userFollowUp + '/transfer/bulk'), generator.interceptSendCollection('UserFollowupRequest', userFollowupRequests))
                    .then(function (result) {
                        return result.data.rs;
                    })
            };

            /**
             *
             * @param record
             * @param $event
             * @returns {*}
             */
            self.openReassignDialog = function (record, $event) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('reassign-followup-book'),
                        controller: 'reassignFollowupBookPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            record: record,
                            reassignFollowup: new ReassignFollowup({
                                vsId: record.vsId,
                                docClassId: record.docClassId,
                                oldDynamicRuleId: record.userDynamicFollowupId
                            })
                        },
                        resolve: {
                            dynamicFollowUpRules: function (dynamicFollowupService, employeeService, _) {
                                'ngInject';
                                return dynamicFollowupService.loadDynamicFollowUpsByOu(employeeService.getEmployee().getOUID());
                            },
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    });
            }

            /**
             *
             * @param reassignedRule
             * @returns {*}
             */
            self.reassignFollowupBooks = function (reassignedRule) {
                return $http
                    .put((urlService.userFollowUp + '/reassign-dynamic-rule'), reassignedRule)
                    .then(function (result) {
                        return result.data.rs;
                    })
            };

            self.loadPersonalFollowupChartData = function () {
                return $http.get(urlService.userFollowUp + '/user-folder-stats')
                    .then(function (result) {
                        return generator.generateCollection(result.data.rs, PersonalFollowupStatistics);
                    })
            }

            self.loadEmployeesFollowupChartData = function (orgId) {
                return $http.get(urlService.userFollowUp + '/user-followup-stats/' + orgId)
                    .then(function (result) {
                        return generator.generateCollection(result.data.rs, EmployeeFollowupStatistics);
                    })
            }
        }
    );
};
