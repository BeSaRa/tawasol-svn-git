module.exports = function (app) {
    app.controller('predefinedActionPopCtrl', function (_,
                                                        toast,
                                                        generator,
                                                        dialog,
                                                        langService,
                                                        predefinedAction,
                                                        editMode,
                                                        LangWatcher,
                                                        $timeout,
                                                        $mdSidenav,
                                                        $scope,
                                                        moment,
                                                        $q,
                                                        comments,
                                                        cmsTemplate,
                                                        errorMessage,
                                                        centralArchiveOUs,
                                                        actionKey,
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
                                                        selectedTab,
                                                        Information,
                                                        errorCode,
                                                        gridService,
                                                        PredefinedActionMember,
                                                        predefinedActionService) {
        'ngInject';
        var self = this;
        self.controllerName = 'predefinedActionPopCtrl';

        self.predefinedAction = predefinedAction;
        self.predefinedActionModel = angular.copy(self.predefinedAction);
        self.editMode = editMode;

        self.inlineUserOUSearchText = '';
        var currentOUEscalationProcess = employeeService.getEmployee().userOrganization.escalationProcess;

        self.actionKey = actionKey;

        // in case if the current user in central archive and in add incoming page.
        self.selectedOrganizationToSend = angular.isString(selectedTab) ? false : selectedTab;
        // current selected tab
        self.selectedTab = self.selectedOrganizationToSend ? selectedTab.tab : (selectedTab || 'users');
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
        self.favoriteUsersCopy = angular.copy(self.favoriteUsers);
        // favorite Organizations
        self.favoriteOrganizations = _mapOrganizationByType(distributionWFService.favoriteOrganizations);
        self.favoriteOrganizationsCopy = angular.copy(self.favoriteOrganizations);
        // all private users
        self.privateUsers = _mapWFUser(distributionWFService.privateUsers);
        self.privateUsersCopy = angular.copy(self.privateUsers);
        // all managers users
        self.managerUsers = _mapWFUser(distributionWFService.managerUsers);
        self.managerUsersCopy = angular.copy(self.managerUsers);
        // all vice manager users
        self.viceManagerUsers = _mapWFUser(distributionWFService.viceManagerUsers);
        self.viceManagerUsersCopy = angular.copy(self.viceManagerUsers);
        // all available workflow users related to securitySchema.
        self.workflowUsers = angular.copy(self.users);
        // all government entities heads
        self.governmentEntitiesHeads = _mapWFUser(distributionWFService.governmentEntitiesHeads);
        self.governmentEntitiesHeadsCopy = angular.copy(self.governmentEntitiesHeads);
        // all workflow groups
        self.workflowGroups = _mapWFGroup(distributionWFService.workflowGroups);
        self.workflowGroupsCopy = angular.copy(self.workflowGroups);
        // all registry organizations
        self.registryOrganizations = _mapWFOrganization(distributionWFService.registryOrganizations, 'OUReg');
        // all organizations for users tab -> organization mail unit dropdown
        self.organizationGroups = _mapOrganizationByType(distributionWFService.organizationGroups, true, true);
        self.organizationGroupsCopy = angular.copy(self.organizationGroups);
        // users search criteria
        self.usersCriteria = new UserSearchCriteria({
            ou: self.organizationGroups.length ? _.find(self.organizationGroups, function (item) {
                return item.toOUId === ('g' + employeeService.getEmployee().getOUID())
            }) : employeeService.getEmployee().getOUID(),
            // to hide organizations dropdown and add whole organization button
            hide: !self.organizationGroups.length
        });

        // selected workflowItems
        self.selectedWorkflowItems = [];
        self.textButton = 'save';
        self.selectedFavoriteTab = 'users';


        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentFavoriteTab = function (tabName) {
            self.selectedFavoriteTab = tabName;
        };

        /**
         * @description select clicked tab
         * @param tab
         */
        self.selectTab = function (tab) {
            return distributionWFService
                .loadTabContent(tab)
                .then(function (result) {
                    var gridName = null;
                    switch (result.property) {
                        case 'registryOrganizations':
                            gridName = 'OUReg';
                            break;
                        case 'organizationGroups':
                            gridName = 'OUGroup';
                            break;
                        default:
                            gridName = null;
                    }
                    self.selectedTab = tab;
                    if (result.onDemand) {
                        self[result.property] = self.tabMapper[result.property](result.data, gridName);
                        self[result.property + 'Copy'] = angular.copy(self[result.property]);
                    }
                    return true;
                })
                .catch(function (error) {
                    console.log(error);
                });

        };

        if (self.selectedOrganizationToSend) {
            self.selectTab(self.selectedTab).then(function () {
                _addSelectedOrganization(self.selectedOrganizationToSend);
            });
        }

        function _addSelectedOrganization(selected) {
            var organization = (selected.ou === selected.registryOU)
                ? _findOrganization(selected.registryOU, selected.registryOU, true)
                : _findOrganization(selected.registryOU, selected.ou);
            if (!!organization)
                self.selectedWorkflowItems.push(organization);
        }

        function _findOrganization(regOU, ouId, justByRegOu) {
            return _.find((justByRegOu ? self.registryOrganizations : self.organizationGroups), function (item) {
                return item.toOUId === ouId;
            })
        }

        // grid options for all grids
        self.grid = {
            users: {
                name: gridService.grids.launch.users,
                limit: 5, // default limit
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
                name: gridService.grids.launch.favoritesUsers,
                limit: (self.favoriteUsers.length + 21), // default limit
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
                selected: [],
                searchColumns: {
                    name: function (record) {
                        return record.getTranslatedKey();
                    },
                    ou: function (record) {
                        return langService.current + 'OUName';
                    }
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.favoriteUsers = gridService.searchGridData(self.grid.favoriteUsers, self.favoriteUsersCopy);
                }
            },
            privateUsers: {
                name: gridService.grids.launch.privateUsers,
                limit: 5, // default limit
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
                selected: [],
                searchColumns: {
                    name: function (record) {
                        return record.getTranslatedKey();
                    },
                    ou: function (record) {
                        return langService.current + 'OUName';
                    }
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.privateUsers = gridService.searchGridData(self.grid.privateUsers, self.privateUsersCopy);
                }
            },
            managerUsers: {
                name: gridService.grids.launch.managers,
                limit: gridService.getGridPagingLimitByGridName(gridService.grids.launch.managers) || 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                selected: [],
                limitOptions: gridService.getGridLimitOptions(gridService.grids.launch.managers, self.managerUsers.length),
                pagingCallback: function (page, limit) {
                    gridService.setGridPagingLimitByGridName(gridService.grids.launch.managers, limit);
                },
                searchColumns: {
                    name: function (record) {
                        return record.getTranslatedKey();
                    },
                    ou: function (record) {
                        return langService.current + 'OUName';
                    }
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.managerUsers = gridService.searchGridData(self.grid.managerUsers, self.managerUsersCopy);
                }
            },
            viceManagerUsers: {
                name: gridService.grids.launch.viceManagers,
                limit: gridService.getGridPagingLimitByGridName(gridService.grids.launch.viceManagers) || 5, // default limit
                page: 1, // first page
                order: '', // default sorting order
                selected: [],
                limitOptions: gridService.getGridLimitOptions(gridService.grids.launch.viceManagers, self.viceManagerUsers.length),
                pagingCallback: function (page, limit) {
                    gridService.setGridPagingLimitByGridName(gridService.grids.launch.viceManagers, limit);
                },
                searchColumns: {
                    name: function (record) {
                        return record.getTranslatedKey();
                    },
                    ou: function (record) {
                        return langService.current + 'OUName';
                    }
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.viceManagerUsers = gridService.searchGridData(self.grid.viceManagerUsers, self.viceManagerUsersCopy);
                }
            },
            governmentEntitiesHeads: {
                name: gridService.grids.launch.presidentMinisters,
                limit: 5, // default limit
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
                selected: [],
                searchColumns: {
                    name: function (record) {
                        return record.getTranslatedKey();
                    },
                    ou: function (record) {
                        return langService.current + 'OUName';
                    }
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.governmentEntitiesHeads = gridService.searchGridData(self.grid.governmentEntitiesHeads, self.governmentEntitiesHeadsCopy);
                }
            },
            workflowGroups: null,
            favoriteOus: null,
            ous: null
        };

        function _checkPermission(permission) {
            return employeeService.hasPermissionTo(permission);
        }

        self.checkIfNotInternalDocument = function () {
            return true;
        };

        self.isPrivateDoc = function () {
            return false;
        };

        // workflow tabs
        self.workflowTabs = {
            favorites: {
                lang: 'workflow_menu_item_favorites',
                icon: 'star',
                show: true,
                disabled: false,
                modelName: 'favoriteUsers'
            },
            users: {
                lang: 'workflow_menu_item_users',
                icon: 'account',
                show: _checkPermission('SEND_TO_USERS_'),
                disabled: false,
                modelName: 'users'
            },
            private_users: {
                lang: 'workflow_menu_item_private_users',
                icon: 'account-star',
                show: employeeService.getEmployee().canSendToPrivate(), //_checkPermission('SEND_TO_PRIVATE_USERS') &&
                disabled: false,
                modelName: 'privateUsers'
            },
            manager_users: {
                lang: 'workflow_menu_item_managers',
                icon: 'account-check',
                show: employeeService.getEmployee().canSendToManagers(), // _checkPermission('SEND_TO_MANAGERS') &&
                disabled: false,
                modelName: 'managerUsers'
            },
            vice_manager_users: {
                lang: 'workflow_menu_item_vice_managers',
                icon: 'account-child',
                show: employeeService.getEmployee().canSendToViceManagers(),
                disabled: false,
                modelName: 'viceManagerUsers'
            },
            heads_of_government_entities: {
                lang: 'workflow_menu_item_heads_of_governments',
                icon: 'shield-account',
                show: _checkPermission('SEND_TO_HEAD_OF_GOVERNMENT_ENTITY'),
                disabled: false,
                modelName: 'governmentEntitiesHeads'
            },
            workflow_groups: {
                lang: 'workflow_menu_item_workflow_groups',
                icon: 'account-group',
                show: false,  //_checkPermission('SEND_TO_GROUPS_'),
                disabled: false,
                modelName: 'workflowGroups'
            },
            registry_organizations: {
                lang: 'workflow_menu_item_registry_organizations',
                icon: 'bank',
                show: _checkPermission('SEND_TO_ELECTRONIC_INCOMING_QUEUES'),
                disabled: false,
                modelName: 'registryOrganizations'
            }
        };

        self.defaultWorkflowTabSettings = {};

        // distribution workflow
        self.distributionWF = new DistributionWF();
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


        // create default workflow item Settings for each tab
        _createDefaultWFItemTabs();


        function _mapOrganizationByType(organizations, includeCentralArchive, allOuGroup) {
            // filter all regOU (has registry)
            var regOus = _.filter(organizations, function (ou) {
                    return ou.hasRegistry;
                }),
                // filter all sections (no registry)
                sections = _.filter(organizations, function (ou) {
                    return !ou.hasRegistry;
                }),
                // registry parent organization
                parentRegistryOu;

            // To show (regou - section), append the dummy property "tempRegOUSection"
            regOus = _.map(regOus, function (regOu) {
                regOu.tempRegOUSection = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });
            sections = _.map(sections, function (section) {
                parentRegistryOu = (section.regouId || section.regOuId);
                if (typeof parentRegistryOu === 'number') {
                    parentRegistryOu = _.find(organizations, function (ou) {
                        return ou.id === parentRegistryOu;
                    });
                }

                section.tempRegOUSection = new Information({
                    arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + section.arName,
                    enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + section.enName
                });
                return section;
            });

            sections = _mapWFOrganization(sections, 'OUGroup');
            regOus = _mapWFOrganization(regOus, allOuGroup ? 'OUGroup' : 'OUReg');
            if (includeCentralArchive) {
                centralArchiveOUs = _.map(centralArchiveOUs, function (ou) {
                    ou.tempRegOUSection = new Information({
                        arName: ou.arName,
                        enName: ou.enName
                    });
                    return ou;
                });
                centralArchiveOUs = _mapWFOrganization(centralArchiveOUs, 'OUGroup');
                sections = sections.concat(centralArchiveOUs);
            }

            // sorting from BE based on user selection (alphabetical or by org structure)
            return _.map([].concat(regOus, sections), function (item) {
                item.toOUId = 'g' + item.toOUId;
                return item;
            });
        }

        /**
         * @description map workflow Item to WorkflowGroup
         * @param collection
         * @param gridName
         * @returns {Array}
         * @private
         */
        function _mapWFGroup(collection, gridName) {
            return _.map(collection, function (workflowOrganization) {
                workflowOrganization.members = _mapWFUser(workflowOrganization.members, gridName);
                return (new DistributionGroupWFItem()).mapFromWFGroup(workflowOrganization).setGridName(gridName || null);
            });
        }

        /**
         * @description map workflow item to WFOrganization
         * @param collection
         * @param gridName
         * @returns {Array}
         * @private
         */
        function _mapWFOrganization(collection, gridName) {
            return _.map(collection, function (workflowOrganization) {
                return (new DistributionOUWFItem()).mapFromWFOrganization(workflowOrganization).setGridName(gridName || null);
            });
        }

        /**
         * @description map the WFUser to be dist user.
         * @param collection
         * @param gridName
         * @returns {Array}
         * @private
         */
        function _mapWFUser(collection, gridName) {
            return _.map(collection, function (workflowUser) {
                return (new DistributionUserWFItem()).mapFromWFUser(workflowUser).setGridName(gridName || null);
            });
        }

        /**
         * @description map ouApplicationUser
         * @param collection
         * @param gridName
         * @returns {Array}
         * @private
         */
        function _mapOUApplicationUser(collection, gridName) {
            return _.map(collection, function (ouApplicationUser) {
                return (new DistributionUserWFItem()).mapOUApplicationUser(ouApplicationUser).setGridName(gridName || null);
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
         * @description set dist workflow Item properties.
         * @param distWorkflowItem
         * @param result
         * @private
         */
        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setDueDate(result.dueDate)
                .setSLADueDate(result.sLADueDate)
                .setComments(result.comments)
                .setAction(result.action)
                .setSendSMS(result.sendSMS)
                .setSendEmail(result.sendEmail)
                .setSecureAction(result.isSecureAction)
                .setEscalationStatus(result.escalationStatus)
                .setEscalationUser(result.escalationUserId)
                .setEscalationUserOUId(result.escalationUserId);
        }

        /**
         * @description just for apply notifications settings
         * @param distWorkflowItem
         * @param result
         * @private
         */
        function _applyNotificationSettings(distWorkflowItem, result) {
            distWorkflowItem
                .setSendSMS(result.sendSMS)
                .setSendEmail(result.sendEmail);
        }

        /**
         * @description add users to selected grid
         * @param users
         * @private
         */
        function _addUsersToSelectedGrid(users) {
            users = angular.isArray(users) ? users : [users];
            _.map(users, function (item) {
                if (!item.escalationStatus) {
                    item.escalationStatus = currentOUEscalationProcess;
                }
                return item;
            });
            self.selectedWorkflowItems = self.selectedWorkflowItems.concat(users);
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
                var proxyStartDate = user.proxyInfo.proxyStartDate ? moment(user.proxyInfo.proxyStartDate).format('YYYY-MM-DD') : null;
                var proxyEndDate = user.proxyInfo.proxyEndDate ? moment(user.proxyInfo.proxyEndDate).format('YYYY-MM-DD') : null;
                return [user.arName, user.enName, user.proxyInfo.arName, user.proxyInfo.enName, user.proxyInfo.proxyDomain, proxyStartDate, proxyEndDate, user.proxyInfo.proxyMessage];
            });

            var table = tableGeneratorService.createTable([langService.get('arabic_name'), langService.get('english_name'), langService.get('proxy_arabic_name'), langService.get('proxy_english_name'), langService.get('proxy_domain'), langService.get('start_date'), langService.get('end_date'), langService.get('proxy_message')], 'error-table');
            table.createTableRows(tableRows);

            titleTemplate.append(table.getTable(true));

            return titleTemplate.html();
        }

        /**
         * @description to check if the user exists inside selected users or not.
         * @private
         * @param workflowItem
         */
        function _workflowItemExists(workflowItem) {
            return _.find(self.selectedWorkflowItems, function (disWorkflowUserItem) {
                return disWorkflowUserItem.isSameWorkflowItem(workflowItem);
            });
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
                return exists ? _workflowItemExists(user) : !_workflowItemExists(user);
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
         * @param distWorkflowItem
         * @private
         */
        function _removeFromSelectedUser(distWorkflowItem) {
            self.selectedWorkflowItems = _.filter(self.selectedWorkflowItems, function (item) {
                return !item.isSameWorkflowItem(distWorkflowItem)
            });
        }

        /**
         * @description remove from selected grid for type department
         * @param distWorkflowItem
         * @private
         */
        function _removeFromSelectedDepartment(distWorkflowItem) {
            self.selectedWorkflowItems = _.filter(self.selectedWorkflowItems, function (item) {
                return !item.isSameWorkflowItem(distWorkflowItem);
            });
        }

        /**
         * @description remove from selected grid for type group
         * @param distWorkflowItem
         * @private
         */
        function _removeFromSelectedGroup(distWorkflowItem) {
            self.selectedWorkflowItems = _.filter(self.selectedWorkflowItems, function (item) {
                return !item.isSameWorkflowItem(distWorkflowItem);
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
                    self[self.favoritesTypes[type].modelName] = self.favoritesTypes[type].map(result);
                    self[self.favoritesTypes[type].modelName + 'Copy'] = angular.copy(self[self.favoritesTypes[type].modelName]);
                    return self[self.favoritesTypes[type].modelName];
                });
        }

        // change FavStatus map
        self.changeFavStatus = {
            user: _changeUserFavStatus,
            organization: _changeOrganizationFavStatus
        };
        // grids type
        self.gridTypes = [
            'users',
            'favoriteUsers',
            'favoriteOrganizations',
            'privateUsers',
            'managerUsers',
            // 'governmentEntitiesHeads',
            'registryOrganizations',
            'organizationGroups'
        ];

        /**
         * @description change relationId for users.
         * @param collection
         * @param workflowItem
         * @private
         */
        function _changeRelationForUsers(collection, workflowItem) {
            _.map(collection, function (item, index) {
                if (collection[index].isSameWorkflowItem(workflowItem)) {
                    collection[index].setRelationId(workflowItem.relationId);
                }
            })
        }

        /**
         * @description change
         * @private
         */
        function _changeOrganizationFavStatus(grids, workflowItems) {
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
                    _changeRelationForUsers(self.selectedWorkflowItems, item);
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
                    _changeRelationForUsers(self.selectedWorkflowItems, item);
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

        function _filterWFUsers(item) {
            return item.isUser();
        }

        function _filterWFGroups(item) {
            return item.isGroup();
        }

        function _filterWFRegDepartments(item) {
            return item.gridName === 'OUReg';
        }

        function _filterWFDepartmentsGroup(item) {
            return item.gridName === 'OUGroup';
        }

        self.tabMapper = {
            privateUsers: _mapWFUser,
            managerUsers: _mapWFUser,
            viceManagerUsers: _mapWFUser,
            governmentEntitiesHeads: _mapWFUser,
            workflowGroups: _mapWFGroup,
            organizationGroups: _mapWFOrganization,
            registryOrganizations: _mapWFOrganization
        };

        /**
         * @description toggle sidebar.
         */
        self.toggleWorkflowSidebar = function () {
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
         * @description search users
         */
        self.onSearchUsers = function () {
            if (!self.usersCriteria.ou)
                return;
            return distributionWFService
                .searchUsersByCriteria(self.usersCriteria)
                .then(function (result) {
                    self.users = _mapWFUser(result);
                });
        };

        self.onSearchUsers();

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
                    _changeFavoritesStatus(self.gridTypes, workflowItem);
                    toast.success(langService.get(result.action ? 'add_to_favorites_success' : 'remove_favorites_success').change({name: workflowItem.getTranslatedName()}))
                })
                .catch(function (error) {
                  //  console.log(error);
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
            }) && selected.length;
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
                    .then(function (items) {
                        _changeFavoritesStatus(self.gridTypes, items);
                        toast.success(langService.get('bulk_favorites_removed_success').change({name: self.structureTypes[type]}))
                    });
            } else {
                // add the remaining to favorites
                promise = distributionWFService
                    .addBulkWorkflowItemToFavorites(unFavorites, type)
                    .then(function (items) {
                        _changeFavoritesStatus(self.gridTypes, items);
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
        self.workflowItemSettingDialog = function (dialogTitle, distWorkflowItem, $event, currentGridName) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('workflow-item-settings'),
                controller: 'workflowItemSettingPopCtrl',
                controllerAs: 'ctrl',
                targetEvent: $event,
                bindToController: true,
                locals: {
                    comments: self.comments,
                    workflowActions: self.workflowActions,
                    dialogTitle: dialogTitle,
                    distWorkflowItem: distWorkflowItem,
                    gridName: currentGridName || false,
                    organizationGroups: self.organizationGroupsCopy,
                    fromPredefined: true
                }
            })
        };
        /**
         * @description set default dist Workflow Item Properties
         * @param collection
         * @param distWorkflowItem
         * @param $event
         * @param currentGridName
         */
        self.setDefaultWorkflowItemsSettings = function (collection, distWorkflowItem, $event, currentGridName) {
            // workflow_properties
            return self
                .workflowItemSettingDialog(langService.get('set_default_workflow_attributes'), distWorkflowItem, $event, currentGridName)
                .then(function (result) {
                    _setDistWorkflowItem(distWorkflowItem, result);
                    _.map(collection, function (item, index) {
                        _setDistWorkflowItem(collection[index], result);
                    });
                });
        };

        self.applyNotificationSettings = function (collection, distWorkflowItem, $event) {
            _.map(collection, function (item, index) {
                _applyNotificationSettings(collection[index], distWorkflowItem);
            });
        };
        /**
         * @description set setting to dist workflowItem.
         * @param distWorkflowItem
         * @param $event
         * @param currentGridName
         */
        self.setSettingsToDistWorkflowItem = function (distWorkflowItem, $event, currentGridName) {
            return self
                .workflowItemSettingDialog((langService.get('workflow_properties') + ' ' + distWorkflowItem.getTranslatedName()), distWorkflowItem, $event, currentGridName, self.organizationGroupsCopy)
                .then(function (result) {
                    _setDistWorkflowItem(distWorkflowItem, result);
                    //self.addSelectedUsersToGrid(distWorkflowItem, $event);
                    self.addSelectedUserToGrid(distWorkflowItem, $event);
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
         * @returns {boolean}
         * @param workflowItem
         */
        self.workItemNotExists = function (workflowItem) {
            return !_workflowItemExists(workflowItem);
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
         * @param distWorkflowItem
         * @param $event
         */
        self.deleteFromSelected = function (distWorkflowItem, $event) {
            if (distWorkflowItem.isUser()) {
                _removeFromSelectedUser(distWorkflowItem);
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

        self.addToSelected = function (workflowItem, checkProxy) {
            if (_getUsersNotExists(workflowItem).length) {
                // && workflowItem.gridName.toLowerCase() !== 'oureg'
                if (workflowItem.gridName !== 'OUGroup' && !workflowItem.escalationStatus) {
                    workflowItem.escalationStatus = currentOUEscalationProcess;
                }
                self.selectedWorkflowItems.push(workflowItem);
            }
        };

        self.checkWorkflowItemsCompleteStatus = function () {
            var collections = self.selectedWorkflowItems,
                types = langService.get('users_or_organizations');
            if (!collections.length) {
                dialog.errorMessage(langService.get('please_select_workflow_items_to').change({name: types}));
                return $q.reject();
            }

            // unCompleted
            var unCompleted = _.filter(collections, function (item) {
                return !item.isWFComplete() || !item.isEscalationComplete(true);
            });
            // completed
            var completed = _.filter(collections, function (item) {
                return item.isWFComplete() && item.isEscalationComplete(true);
            });

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

        self.savePredefinedAction = function (form, $event) {
            if (form.$invalid) {
                return;
            }

            return self.checkWorkflowItemsCompleteStatus()
                .then(function (collection) {
                    self.distributionWF.setNormalUsers(_.filter(collection, _filterWFUsers));
                    self.distributionWF.setReceivedOUs(_.filter(collection, _filterWFDepartmentsGroup));
                    self.distributionWF.setReceivedRegOUs(_.filter(collection, _filterWFRegDepartments));

                    // workflowGroup is not added to predefined action
                    //self.distributionWF.setWfGroups(_.filter(collection, _filterWFGroups));

                    _typeCastToPredefinedAction();

                    var method = self.editMode ? 'updatePredefinedAction' : 'addPredefinedAction';

                    return predefinedActionService[method](self.predefinedAction)
                        .then(function (result) {
                            dialog.hide(result);
                        });
                })
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        function _checkFavoritesError() {
            if (!errorMessage || !errorMessage.length)
                return;

            return dialog
                .errorMessage(langService.get('error_occurred_while_load_favorites').change({
                    name: _.map(errorMessage, function (item) {
                        return langService.get(item);
                    }).join(', ')
                }));
        }

        function _setPredefinedActionMember(member, data) {
            member
                .setId(data.id)
                .setToUserId(data.toUserId)
                .setActionId(data.action)
                .setSLADueDate(data.sLADueDate)
                .setActionType(data.getWorkflowItemType())
                .setSendSMS(data.sendSMS)
                .setSendEmail(data.sendEmail)
                .setUserComment(data.comments)
                .setSecureComment(data.isSecureAction)
                .setSendRelatedDocs(data.sendRelatedDocs)
                .setEscalationStatus(data.escalationStatus)
                .setEscalationUser(data.escalationUserId)
                .setEscalationUserOUId(data.escalationUserOUId);

            if (data.getWorkflowItemType() === 'user') {
                member.setToOUID(data.appUserOUID);
            } else if (data.getWorkflowItemType() === 'groupMail' || data.getWorkflowItemType() === 'organization') {
                member.setToOUID(data.toOUId);
            }

            return member;
        }

        function _typeCastToPredefinedAction() {
            self.predefinedAction.members = [];
            for (var recordType in self.distributionWF) {
                // check property should not be in prototype, but it should be attached to the object itself
                if (self.distributionWF.hasOwnProperty(recordType)) {
                    for (var i = 0; i < self.distributionWF[recordType].length; i++) {
                        var member = _setPredefinedActionMember(new PredefinedActionMember(), self.distributionWF[recordType][i]);
                        self.predefinedAction.members.push(member);
                    }
                }
            }
            return self.predefinedAction;
        }

        $timeout(function () {
            if (self.editMode) {
                self.selectedWorkflowItems = [];
                predefinedActionService.typeCastMembersToDistributionWFItems(self.predefinedAction.members, false, true)
                    .then(function (result) {
                        self.selectedWorkflowItems = result;
                    });
            }
        });

    });
};
