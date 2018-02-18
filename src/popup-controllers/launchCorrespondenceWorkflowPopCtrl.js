module.exports = function (app) {
    app.controller('launchCorrespondenceWorkflowPopCtrl', function (LangWatcher,
                                                                    $timeout,
                                                                    $mdSidenav,
                                                                    $scope,
                                                                    moment,
                                                                    $q,
                                                                    comments,
                                                                    toast,
                                                                    cmsTemplate,
                                                                    _,
                                                                    actionKey,
                                                                    multi,
                                                                    tableGeneratorService,
                                                                    workflowActions,
                                                                    distributionWFService,
                                                                    DistributionWF,
                                                                    DistributionOUWFItem,
                                                                    DistributionUserWFItem,
                                                                    DistributionGroupWFItem,
                                                                    DistributionWFItem,
                                                                    employeeService,
                                                                    UserSearchCriteria,
                                                                    loadingIndicatorService,
                                                                    langService,
                                                                    selectedTab,
                                                                    dialog,
                                                                    correspondence) {
        'ngInject';
        var self = this;
        self.controllerName = 'launchCorrespondenceWorkflowPopCtrl';

        /**
         * get multi info in case the correspondence array.
         * @param correspondences
         * @returns {Array}
         * @private
         */
        function _getMultiInfo(correspondences) {
            return _.map(correspondences, function (item) {
                return item.getInfo();
            });
        }

        /**
         * @description get multi approve status.
         * @param info
         * @returns {Array}
         * @private
         */
        function _getMultiApproveStatus(info) {
            return _.map(info, function (item) {
                return {
                    title: item.title,
                    status: item.needToApprove()
                };
            });
        }

        function _justForYourInformationDialog() {
            var result = self.multi ? approvedStatus = _.some(self.info, function (item) {
                    return item.status
                }) : approvedStatus,
                message = self.multi ? langService.get('selected_document_has_not_approved_document').addLineBreak(_.map(self.info, 'title')).join('<br />') : langService.get('cannot_send_to_multi');
            result ? $timeout(function () {
                dialog.infoMessage(message)
            }, 800) : false;
        }

        function _getApprovedStatus() {
            return approvedStatus;
        }


        // cannot_send_to_multi
        self.actionKey = actionKey;
        // selected_document_has_not_approved_document
        self.multi = multi;
        // current correspondence information
        self.info = self.multi ? _getMultiInfo(correspondence) : correspondence.getInfo();
        // check document if approved or not.
        var approvedStatus = self.multi ? _getMultiApproveStatus(self.info) : self.info.needToApprove();
        // current correspondence or workItem
        self.correspondence = correspondence;
        // current selected tab
        self.selectedTab = selectedTab || 'users';
        // current sidebar status
        self.sidebarStatus = true;
        // full screen status
        self.fullScreen = false;
        // to display the loading indicator
        self.loadingIndicatorService = loadingIndicatorService;
        // all active user comment
        self.comments = comments;
        // all current user workflow actions
        self.workflowActions = workflowActions;
        // users search criteria
        self.usersCriteria = new UserSearchCriteria({
            ou: employeeService.getEmployee().getOUID()
        });
        self.favoritesTypes = {
            users: {
                map: _mapWFUser,
                modelName: 'favoriteUsers'
            },
            organizations: {
                map: _mapWFOrganization,
                modelName: 'favoriteOrganizations'
            }
        };
        // our grids properties
        // users
        self.users = _mapWFUser(distributionWFService.workflowUsers);
        // favorite Users
        self.favoriteUsers = _mapWFUser(distributionWFService.favoriteUsers);
        // favorite Organizations
        self.favoriteOrganizations = distributionWFService.favoriteOrganizations;
        // all private users
        self.privateUsers = _mapWFUser(distributionWFService.privateUsers);
        // all managers users
        self.managerUsers = _mapWFUser(distributionWFService.managerUsers);
        // all available workflow users related to securitySchema.
        self.workflowUsers = angular.copy(self.users);
        // all government entities heads
        self.governmentEntitiesHeads = _mapWFUser(distributionWFService.governmentEntitiesHeads);
        // all workflow groups
        self.workflowGroups = _mapWFGroup(distributionWFService.workflowGroups);
        // all registry organizations
        self.registryOrganizations = [];
        // all organizations for organization mail unit
        self.organizationalUnits = [];

        // selected users
        self.selectedUsers = [];

        // grid options for all grids
        self.grid = {
            users: {
                limit: 4, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.users.length + 21);
                        }
                    }
                ],
                selected: []
            },
            favoriteUsers: {
                limit: 4, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.favoriteUsers.length + 21);
                        }
                    }
                ],
                selected: []
            },
            privateUsers: {
                limit: 4, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.privateUsers.length + 21);
                        }
                    }
                ],
                selected: []
            },
            managerUsers: {
                limit: 4, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.managerUsers.length + 21);
                        }
                    }
                ],
                selected: []
            },
            governmentEntitiesHeads: {
                limit: 4, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.governmentEntitiesHeads.length + 21);
                        }
                    }
                ],
                selected: []
            },
            workflowGroups: {
                limit: 4, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.workflowGroups.length + 21);
                        }
                    }
                ],
                selected: []
            }
        };


        // workflow tabs
        self.workflowTabs = {
            users: {
                lang: 'workflow_menu_item_users',
                icon: 'account',
                show: true,
                disabled: false,
                modelName: 'users'
            },
            favorites: {
                lang: 'workflow_menu_item_favorites',
                icon: 'star',
                show: true,
                disabled: false,
                modelName: 'favoriteUsers'
            },
            private_users: {
                lang: 'workflow_menu_item_private_users',
                icon: 'account-star',
                show: true,
                disabled: false,
                modelName: 'privateUsers'
            },
            manager_users: {
                lang: 'workflow_menu_item_managers',
                icon: 'account-check',
                show: true,
                disabled: false,
                modelName: 'managerUsers'
            },
            heads_of_government_entities: {
                lang: 'workflow_menu_item_heads_of_governments',
                icon: 'security-account',
                show: true,
                disabled: false,
                modelName: 'governmentEntitiesHeads'
            },
            workflow_groups: {
                lang: 'workflow_menu_item_workflow_groups',
                icon: 'account-group',
                show: true,
                disabled: _getApprovedStatus(),
                modelName: 'workflowGroups'
            },
            organizational_unit_mail: {
                lang: 'workflow_menu_item_registry_organizational_unit_mail',
                icon: 'contact-mail',
                show: true,
                disabled: _getApprovedStatus(),
                modelName: 'organizationalUnits'

            },
            registry_organizations: {
                lang: 'workflow_menu_item_registry_organizations',
                icon: 'bank',
                show: true,
                disabled: _getApprovedStatus(),
                modelName: 'registryOrganizations'
            }
        };

        self.defaultWorkflowTabSettings = {};

        // distribution workflow
        self.distributionWF = new DistributionWF();
        // selected Grids
        self.selectedGrids = {
            users: {
                selected: [],
                collection: [],
                defaultSettings: new DistributionWFItem(),
                langKey: 'selected_users'
            },
            workflowGroups: {
                selected: [],
                collection: [],
                defaultSettings: new DistributionWFItem(),
                langKey: 'workflow_groups'
            },
            organizations: {
                selected: [],
                collection: [],
                defaultSettings: new DistributionWFItem(),
                langKey: 'organizations_registry'
            },
            organizationGroups: {
                selected: [],
                collection: [],
                defaultSettings: new DistributionWFItem(),
                langKey: 'organizations_group'
            }
        };

        // for all selected grids
        self.gridSelected = {
            users: {
                limit: 4, // default limit
                page: 1, // first page
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.selectedGrids.users.collection.length + 21);
                        }
                    }
                ]
            }
        };

        // screen structure type
        self.structureTypes = {
            User: 'users',
            Organization: 'organizations'
        };
        // check bulk action before add or delete workflowItem to favorites.
        self.bulkActionStatus = false;
        /**
         * @description maps types
         * @type {{OUApplicationUser: _mapOUApplicationUser, WFUser: _mapWFUser}}
         */
        self.mapTypes = {
            OUApplicationUser: _mapOUApplicationUser,
            WFUser: _mapWFUser,
            WFOrganization: _mapWFOrganization,
            WFGroup: _mapWFGroup
        };

        // to display alert to inform the user this document not approved and will not send it to many users.
        _justForYourInformationDialog();
        // create default workflow item Settings for each tab
        _createDefaultWFItemTabs();


        function _mapWFGroup(collection) {
            return _.map(collection, function (workflowOrganization) {
                return (new DistributionGroupWFItem()).mapFromWFGroup(workflowOrganization)
            });
        }

        function _mapWFOrganization(collection) {
            return _.map(collection, function (workflowOrganization) {
                return (new DistributionOUWFItem()).mapFromWFOrganization(workflowOrganization)
            });
        }

        /**
         * @description map the WFUser to be dist user.
         * @param collection
         * @returns {Array}
         * @private
         */
        function _mapWFUser(collection) {
            return _.map(collection, function (workflowUser) {
                return (new DistributionUserWFItem()).mapFromWFUser(workflowUser)
            });
        }

        /**
         * @description map ouApplicationUser
         * @param collection
         * @returns {Array}
         * @private
         */
        function _mapOUApplicationUser(collection) {
            return _.map(collection, function (ouApplicationUser) {
                return (new DistributionUserWFItem()).mapOUApplicationUser(ouApplicationUser);
            });
        }

        /**
         * @description to create default workflowTabSettings for each tab
         * @private
         */
        function _createDefaultWFItemTabs() {
            _.map(Object.keys(self.workflowTabs), function (tab) {
                self.defaultWorkflowTabSettings[tab] = new DistributionWFItem();
            });
        }


        /**
         * @description map from source depend on if the workflowItem is ouApplicationUser or normal User.
         * @param collection
         * @param mapType
         * @returns {*}
         * @private
         */
        function _mapUsersFromSource(collection, mapType) {
            return self.mapTypes[mapType](collection);
        }

        /**
         * @description set dist workflow Item properties.
         * @param distWorkflowItem
         * @param result
         * @private
         */
        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setDueDate(result.dueDate)
                .setComments(result.comments)
                .setAction(result.action);
        }

        /**
         * @description add users to selected grid
         * @param users
         * @private
         */
        function _addUsersToSelectedGrid(users) {
            users = angular.isArray(users) ? users : [users];
            self.selectedGrids.users.collection = self.selectedGrids.users.collection.concat(users);
        }

        /**
         * @description prepare proxy Message
         * @param proxyUsers
         * @private
         */
        function _prepareProxyMessage(proxyUsers) {
            var titleTemplate = angular.element('<span class="validation-title">' + langService.get('proxy_user_message') + '</span> <br/>');
            titleTemplate.html(langService.get('proxy_user_message'));

            var tableRows = _.map(proxyUsers, function (user) {
                return [user.arName, user.enName, user.proxyInfo.arName, user.proxyInfo.enName, user.proxyInfo.proxyDomain, moment(user.proxyInfo.proxyStartDate).format('YYYY-MM-DD'), moment(user.proxyInfo.proxyEndDate).format('YYYY-MM-DD'), user.proxyInfo.proxyMessage];
            });

            var table = tableGeneratorService.createTable([langService.get('arabic_name'), langService.get('english_name'), langService.get('proxy_arabic_name'), langService.get('proxy_english_name'), langService.get('proxy_domain'), langService.get('start_date'), langService.get('end_date'), langService.get('proxy_message')], 'error-table');
            table.createTableRows(tableRows);

            titleTemplate.append(table.getTable(true));

            return titleTemplate.html();
        }

        /**
         * @description to check if the user exists inside selected users or not.
         * @param user
         * @private
         */
        function _userExists(user) {
            return _.find(self.selectedGrids.users.collection, function (disWorkflowUserItem) {
                return disWorkflowUserItem.isSameUser(user);
            });
        }

        /**
         * @description to chekc if the group exists inside selected groups
         * @param group
         * @private
         */
        function _groupExists(group) {
            return _.find(self.selectedGrids.workflowGroups.collection, function (disWorkflowGroupItem) {
                return disWorkflowGroupItem.isSameGroup(user);
            })
        }

        /**
         * @description get uncompleted distWorkflowItem
         * @param gridName
         * @returns {Array}
         * @private
         */
        function _getUnCompletedItems(gridName) {
            return _.filter(self.selectedGrids[gridName].collection, function (item) {
                return !item.isWFComplete();
            })
        }

        /**
         * @description to get array of exists/not users from given users array
         * @param users
         * @param exists
         * @returns {Array}
         * @private
         */
        function _getUsersExistORNotFromSelectedGrid(users, exists) {
            return _.filter(users, function (user) {
                return exists ? _userExists(user) : !_userExists(user);
            });
        }

        /**
         * @description to get array of not exists users from given array
         * @param users
         * @returns {Array}
         * @private
         */
        function _getUsersNotExists(users) {
            users = angular.isArray(users) ? users : [users];
            return _getUsersExistORNotFromSelectedGrid(users, false);
        }

        /**
         * @description to get array of exists users from given array.
         * @param users
         * @returns {Array}
         * @private
         */
        function _getUsersExists(users) {
            return _getUsersExistORNotFromSelectedGrid(users, true);
        }

        /**
         * @description get proxies users from given users.
         * @param users
         * @returns {Array}
         * @private
         */
        function _getProxiesUsers(users) {
            return _.filter(users, function (item) {
                return item.isUserOutOfOffice();
            });
        }

        /**
         * @description remove from selected grid for type user
         * @param selected
         * @param distWorkflowItem
         * @private
         */
        function _removeFromSelectedUser(selected, distWorkflowItem) {
            self.selectedGrids[selected].collection = _.filter(self.selectedGrids[selected].collection, function (item) {
                return !item.isSameUser(distWorkflowItem);
            });
        }

        /**
         * @description remove from selected grid for type department
         * @param selected
         * @param distWorkflowItem
         * @private
         */
        function _removeFromSelectedDepartment(selected, distWorkflowItem) {
            self.selectedGrids[selected].collection = _.filter(self.selectedGrids[selected].collection, function (item) {
                return item.toOUId === distWorkflowItem.toOUId;
            });
        }

        /**
         * @description remove from selected grid for type group
         * @param selected
         * @param distWorkflowItem
         * @private
         */
        function _removeFromSelectedGroup(selected, distWorkflowItem) {
            self.selectedGrids[selected].collection = _.filter(self.selectedGrids[selected].collection, function (item) {
                return item.wfGroupId === distWorkflowItem.wfGroupId;
            });
        }

        /**
         * @description load favorites by type.
         * @param type
         * @private
         */
        function _loadFavorites(type) {
            return distributionWFService.loadFavorites(type)
                .then(function (result) {
                    return self[self.favoritesTypes[type].modelName] = self.favoritesTypes[type].map(result);
                });
        }

        // change FavStatus map
        self.changeFavStatus = {
            user: _changeUserFavStatus,
            organization: _changeOrganizationFavStatus
        };
        // grids type
        self.gridTypes = {
            users: ['users', 'favoritesUsers'],
            organizations: []
        };

        /**
         * @description change relationId for organizations.
         * @param collection
         * @param workflowItem
         * @private
         */
        function _changeRelationForOrganizations(collection, workflowItem) {
            _.map(collection, function (item, index) {
                collection[index].isSameDepartment(workflowItem) ? collection[index].setRelationId(workflowItem.relationId) : null;
            })
        }

        /**
         * @description change relationId for users.
         * @param collection
         * @param workflowItem
         * @private
         */
        function _changeRelationForUsers(collection, workflowItem) {
            _.map(collection, function (item, index) {
                if (collection[index].isSameUser(workflowItem)) {
                    collection[index].setRelationId(workflowItem.relationId);
                }
            })
        }

        /**
         * @description change
         * @private
         */
        function _changeOrganizationFavStatus() {
            _.map(workflowItems, function (item) {
                _.map(grids, function (grid) {
                    // for the mainGrids
                    if (self.hasOwnProperty(grid) && self[grid].length) {
                        _changeRelationForUsers(self[grid], item);
                    }
                    // for selected on main Grids
                    if (self.grid.hasOwnProperty(grid) && self.grid[grid].selected.length) {
                        _changeRelationForUsers(self.grid[grid].selected, item);
                    }
                    // for main selected grids .
                    if (self.selectedGrids.hasOwnProperty(grid) && self.selectedGrids[grid].collection.length) {
                        _changeRelationForUsers(self.selectedGrids[grid].collection, item);
                    }
                    // for main selected grid selected.
                    if (self.selectedGrids.hasOwnProperty(grid) && self.selectedGrids[grid].selected.length) {
                        _changeRelationForUsers(self.selectedGrids[grid].selected, item);
                    }
                })
            })
        }

        /**
         * @description change users favorite status for given grids
         * @param grids
         * @param workflowItems
         * @private
         */
        function _changeUserFavStatus(grids, workflowItems) {
            _.map(workflowItems, function (item) {
                _.map(grids, function (grid) {
                    // for the mainGrids
                    if (self.hasOwnProperty(grid) && self[grid].length) {
                        _changeRelationForUsers(self[grid], item);
                    }
                    // for selected on main Grids
                    if (self.grid.hasOwnProperty(grid) && self.grid[grid].selected.length) {
                        _changeRelationForUsers(self.grid[grid].selected, item);
                    }
                    // for main selected grids.
                    if (self.selectedGrids.hasOwnProperty(grid) && self.selectedGrids[grid].collection.length) {
                        _changeRelationForUsers(self.selectedGrids[grid].collection, item);
                    }
                    // for main selected grid selected.
                    if (self.selectedGrids.hasOwnProperty(grid) && self.selectedGrids[grid].selected.length) {
                        _changeRelationForUsers(self.selectedGrids[grid].selected, item);
                    }

                })
            })
        }

        /**
         * @description change favorites status for any type.
         * @param grids
         * @param workflowItems
         * @private
         */
        function _changeFavoritesStatus(grids, workflowItems) {
            workflowItems = angular.isArray(workflowItems) ? workflowItems : [workflowItems];
            var type = workflowItems[0].isUser() ? 'user' : 'organization';
            self.changeFavStatus[type](grids, workflowItems);
        }

        /**
         * @description close workflow dialog.
         */
        self.closeCorrespondenceWorkflow = function () {
            dialog.cancel();
        };

        /**
         * @description select clicked tab
         * @param tab
         */
        self.selectTab = function (tab) {
            self.selectedTab = tab;
        };
        /**
         * @description toggle sidebar.
         */
        self.toggleWorkflowSidebar = function () {
            // $mdSidenav('correspondence-workflow-popup').toggle();
            self.sidebarStatus = !self.sidebarStatus;
        };

        self.toggleWorkflowFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };
        /**
         * @description check if the given tab name selected or not
         * @param tabName
         * @returns {boolean}
         */
        self.isSelectedTab = function (tabName) {
            return self.selectedTab === tabName;
        };

        /**
         * @description to get approved status for multi document or one document.
         */
        self.getApprovedStatus = function () {
            return _getApprovedStatus();
        };

        /**
         * @description search users
         */
        self.onSearchUsers = function () {
            return distributionWFService
                .searchUsersByCriteria(self.usersCriteria)
                .then(function (result) {
                    self.users = _mapWFUser(result);
                });
        };

        /**
         * @description toggle favorites workflowItem.
         * @param workflowItem
         */
        self.toggleFav = function (workflowItem) {
            workflowItem
                .toggleFavorite()
                .then(function (result) {
                    if (workflowItem.isUser()) {
                        _loadFavorites('users');
                    } else {
                        _loadFavorites('organizations')
                    }
                    _changeFavoritesStatus(self.gridTypes.users, workflowItem);
                    toast.success(langService.get(result.action ? 'add_to_favorites_success' : 'remove_favorites_success').change({name: workflowItem.getTranslatedName()}))
                })
                .catch(function (error) {
                    toast.error(langService.get('error_messages'));
                });
        };
        /**
         * all selected workflowItems in favorites.
         * @param selected
         * @returns {boolean}
         */
        self.allInFavorites = function (selected) {
            return !_.some(selected, function (workflowItem) {
                return !workflowItem.isFavorite();
            });
        };

        /**
         * @description toggle bulk workflowItem .
         * @param selected
         * @param type
         */
        self.toggleBulkFavorites = function (selected, type) {
            // to use the it  to define type later
            var workflowItem = angular.copy(selected[0]);

            if (!self.bulkActionStatus) {
                self.bulkActionStatus = true;
            } else {
                return;
            }
            // ge all unFavorites
            var unFavorites = _.filter(selected, function (workflowItem) {
                return !workflowItem.isFavorite();
            }), promise;

            if (self.allInFavorites(selected)) {
                // remove all selected workflowItems from favorites.
                promise = distributionWFService
                    .removeBulkWorkflowItemFromFavorites(selected)
                    .then(function () {
                        toast.success(langService.get('bulk_favorites_removed_success').change({name: self.structureTypes[type]}))
                    });
            } else {
                // add the remaining to favorites
                promise = distributionWFService
                    .addBulkWorkflowItemToFavorites(unFavorites, type)
                    .then(function () {
                        toast.success(langService.get('bulk_favorites_added_success').change({name: self.structureTypes[type]}));
                    })
            }
            // make the self.bulkActionStatus  to be false to make users able to toggle again.
            promise.finally(function () {
                if (workflowItem.isUser()) {
                    _loadFavorites('users');
                } else {
                    _loadFavorites('organizations')
                }
                self.bulkActionStatus = false;
            });
        };
        /**
         * @description show out of office for user from grid.
         * @param userWorkflow
         * @param $event
         * @returns {*}
         */
        self.openWorkflowUserOutOfOffice = function (userWorkflow, $event) {
            return userWorkflow.openOutOfOfficeDialog($event);
        };
        /**
         * @description open workflow item settings.
         * @returns {promise|*}
         */
        self.workflowItemSettingDialog = function (dialogTitle, distWorkflowItem, $event) {
            return dialog.showDialog({
                template: cmsTemplate.getPopup('workflow-item-settings'),
                controller: 'workflowItemSettingPopCtrl',
                controllerAs: 'ctrl',
                targetEvent: $event,
                locals: {
                    comments: self.comments,
                    workflowActions: self.workflowActions,
                    dialogTitle: dialogTitle,
                    distWorkflowItem: distWorkflowItem
                }
            })
        };
        /**
         * @description set default dist Workflow Item Properties
         * @param collection
         * @param selectedTab
         * @param notDefault
         * @param $event
         */
        self.setDefaultWorkflowItemsSettings = function (collection, selectedTab, $event, notDefault) {
            var distWorkflowItem = notDefault ? self.selectedGrids[selectedTab].defaultSettings : self.defaultWorkflowTabSettings[selectedTab];
            // workflow_properties
            return self
                .workflowItemSettingDialog(langService.get('set_default_workflow_attributes'), distWorkflowItem, $event)
                .then(function (result) {
                    _setDistWorkflowItem(distWorkflowItem, result);
                    _.map(collection, function (item, index) {
                        _setDistWorkflowItem(collection[index], result);
                    });
                });
        };
        /**
         * @description set setting to dist workflowItem.
         * @param distWorkflowItem
         * @param $event
         */
        self.setSettingsToDistWorkflowItem = function (distWorkflowItem, $event) {
            return self
                .workflowItemSettingDialog((langService.get('workflow_properties') + ' ' + distWorkflowItem.getTranslatedName()), distWorkflowItem, $event)
                .then(function (result) {
                    _setDistWorkflowItem(distWorkflowItem, result);
                })
        };
        /**
         * @description add selected users to selectedGrid
         * @param selectedUsers
         * @param $event
         */
        self.addSelectedUsersToGrid = function (selectedUsers, $event) {
            // just to filter the users before add.
            selectedUsers = _getUsersNotExists(selectedUsers);
            // get proxies users to display message before add.
            var proxies = _getProxiesUsers(selectedUsers);
            // display proxy message
            if (proxies.length)
                dialog.alertMessage(_prepareProxyMessage(proxies));
            // add users to grid
            _addUsersToSelectedGrid(selectedUsers);
        };
        /**
         * @description add selected user to selectedGrid
         * @param selectedUsers
         * @param $event
         */
        self.addSelectedUsersWithIgnoreToGrid = function (selectedUsers, $event) {
            // just to filter the users before add.
            selectedUsers = _getUsersNotExists(selectedUsers);
            _addUsersToSelectedGrid(selectedUsers);
        };
        /**
         * @description add selected user to grid with ignore messages.
         * @param selectedUser
         * @param $event
         */
        self.addSelectedUserWithIgnoreToGrid = function (selectedUser, $event) {
            var user = _getUsersNotExists([selectedUser]);
            _addUsersToSelectedGrid(user);
        };
        /**
         * @description add selected user to grid
         * @param selectedUser
         * @param $event
         */
        self.addSelectedUserToGrid = function (selectedUser, $event) {
            // just to filter the users before add.
            var users = _getUsersNotExists([selectedUser]);
            // get proxies users to display message before add.
            var proxies = _getProxiesUsers(users);
            // display proxy message
            if (proxies.length)
                dialog.alertMessage(_prepareProxyMessage(proxies));
            // add users to grid
            _addUsersToSelectedGrid(users);
        };
        /**
         * @description check if the user not exists.
         * @param user
         * @returns {boolean}
         */
        self.userNotExists = function (user) {
            return !_userExists(user);
        };
        /**
         * @description check if has No Selected users.
         * @param users
         * @returns {Array}
         */
        self.hasNoSelectedUsers = function (users) {
            return _getUsersNotExists(users);
        };

        /**
         * @description to remove from selected grid
         * @param selected
         * @param distWorkflowItem
         * @param $event
         */
        self.deleteFromSelected = function (selected, distWorkflowItem, $event) {
            if (distWorkflowItem.isUser()) {
                _removeFromSelectedUser(selected, distWorkflowItem);
            } else if (distWorkflowItem.isGroup()) {
                _removeFromSelectedGroup(selected, distWorkflowItem);
            } else if (distWorkflowItem.isDepartment()) {
                _removeFromSelectedDepartment(selected, distWorkflowItem);
            }
        };

        /**
         * @description delete bulk selected
         * @param callback
         * @param selected
         * @param collection
         * @private
         */
        function _deleteBulk(callback, selected, collection) {
            _.map(collection, function (item) {
                callback(selected, item);
            });
        }

        /**
         * @description delete bulk from selected grids
         * @param selected
         * @param $event
         */
        self.deleteBulkSelected = function (selected, $event) {
            var collection = self.selectedGrids[selected].selected, distWorkflowItem = collection[0];
            // if no item return from this method
            if (!distWorkflowItem)
                return;
            // check the grid type and invoke
            if (distWorkflowItem.isUser()) {
                _deleteBulk(_removeFromSelectedUser, selected, collection)
            } else if (distWorkflowItem.isGroup()) {
                _deleteBulk(_removeFromSelectedGroup, selected, collection)
            } else if (distWorkflowItem.isDepartment()) {
                _deleteBulk(_removeFromSelectedDepartment, selected, collection)
            }
            self.selectedGrids[selected].selected = [];
        };
        /**
         * @description to check if the current selected grid has items.
         * @param selected
         */
        self.hasSelection = function (selected) {
            return self.selectedGrids[selected].selected.length;
        };
        /**
         * @description to check if
         * @param gridName
         * @returns {boolean}
         */
        self.allComplete = function (gridName) {
            return !_.some(self.selectedGrids[gridName].collection, function (item) {
                return !item.isWFComplete();
            }) && self.selectedGrids[gridName].collection.length;
        };

        function _filterWFUsers(item) {
            return item.isUser();
        }

        function _filterWFGroups(item) {
            return item.isGroup();
        }

        function _filterWFRegDepartments(item) {
            return item.gridName === 'organizations_registry'
        }

        function _filterWFDepartmentsGroup(item) {
            return item.gridName === 'organizations_group';
        }

        /**
         * @description launchWorkflow
         */
        self.launchDistributionCorrespondenceWorkFlow = function () {
            return self.checkWorkflowItemsCompleteStatus()
                .then(function (collection) {
                    self.distributionWF.setNormalUsers(_.filter(collection, _filterWFUsers));
                    distributionWFService.startLaunchWorkflow(self.distributionWF, self.correspondence)
                        .then(function () {
                            toast.success(langService.get('launch_success_distribution_workflow'));
                            dialog.hide();
                        })
                });
        };

        self.checkWorkflowItemsCompleteStatus = function () {
            var result = false, gridKeys = Object.keys(self.selectedGrids), collections = [];
            _.map(gridKeys, function (name) {
                var current = _.map(angular.copy(self.selectedGrids[name].collection), function (item) {
                    item.setGridName(self.selectedGrids[name].langKey);
                    return item;
                });
                collections = collections.concat(current);
            });
            // unCompleted
            var unCompleted = _.filter(collections, function (item) {
                return !item.isWFComplete();
            });
            // completed
            var completed = _.filter(collections, function (item) {
                return item.isWFComplete();
            });

            var types = !self.getApprovedStatus() ? langService.get('users_or_organizations') : langService.get('user');

            if (!collections.length) {
                dialog.errorMessage(langService.get('please_select_workflow_items_to').change({name: types}));
                return $q.reject();
            }

            if (unCompleted.length) {
                return dialog
                    .confirmMessage(langService.get('some_items_have_to_fill_their_required_fields').change({name: types}))
                    .then(function () {
                        return self
                            .workflowItemSettingDialog(langService.get('set_default_workflow_attributes'), new DistributionWFItem())
                            .then(function (result) {
                                _.map(unCompleted, function (item, index) {
                                    _setDistWorkflowItem(unCompleted[index], result);
                                });
                                collections = completed.concat(unCompleted);
                                return collections;
                            });
                    });
            }
            return $q.resolve(collections);

        };


    });
};