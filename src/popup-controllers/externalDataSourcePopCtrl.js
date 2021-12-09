module.exports = function (app) {
    app.controller('externalDataSourcePopCtrl', function (externalDataSourceService,
                                                          _,
                                                          $q,
                                                          $scope,
                                                          $timeout,
                                                          editMode,
                                                          toast,
                                                          ExtImportStore,
                                                          validationService,
                                                          generator,
                                                          $filter,
                                                          dialog,
                                                          langService,
                                                          gridService,
                                                          Information,
                                                          UserExtImportStore,
                                                          organizationService,
                                                          distributionWFService,
                                                          userExternalDataSourceService,
                                                          externalDataSource) {
        'ngInject';
        var self = this;
        self.controllerName = 'externalDataSourcePopCtrl';
        self.editMode = editMode;
        self.externalDataSource = angular.copy(externalDataSource);
        self.model = angular.copy(externalDataSource);
        self.externalDataSourceForm = null;
        self.userExternalDataSourceForm = null;
        self.mappedUsers = [];
        self.mappedUsersCopy = [];
        self.userFormShown = false;
        self.ouList = [];
        self.isOrgListLoaded = false;

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            status: 'status',
            dataSourceJndi: 'data_source_connection',
            sourceName: 'data_source_name',
            sourceIdentifier: 'identifier',
            contentColumn: 'content_column',
            contentTypeColumn: 'content_type_column',
            metaDataColumns: 'meta_data_columns'
        };

        self.selectedTab = 'basic';
        self.selectedTabIndex = 0;

        self.inlineOUSearchText = '';
        self.inlineAppUserSearchText = '';
        self.userExtDataSource = null;

        self.usersGrid = {
            name: 'usersGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.mappedUsers.length + 21)
                    }
                }
            ],
            searchColumns: {
                organization: function () {
                    return self.getSortingKey('ouInfo', 'AdminResultRelation');
                },
                user: function () {
                    return self.getSortingKey('userInfo', 'Information');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.mappedUsers = gridService.searchGridData(self.usersGrid, self.mappedUsersCopy);
            }
        };
        self.selectedUsers = [];

        self.isValidExternalDataSourceForm = function (form) {
            form = form || self.externalDataSourceForm;
            if (!form) {
                return true;
            }
            return form.$valid;
        }

        self.isValidUserExternalDataSourceForm = function (form) {
            form = form || self.userExternalDataSourceForm;
            if (!form) {
                return true;
            }
            return form.$valid;
        }

        function _validateMetadataColumnsControl() {
            var metaDataColumnsControl = generator.getFormControlByName(self.externalDataSourceForm, 'metaDataColumns');
            if (metaDataColumnsControl) {
                if (metaDataColumnsControl.$invalid && metaDataColumnsControl.$error) {
                    metaDataColumnsControl.$setValidity('required', false);
                }
                metaDataColumnsControl.$setTouched();
            }
        }

        var _mapRegOUSections = function (ouList) {
            var regOus = [], sections = [], parentRegistryOu;
            // filter all regOU (has registry) and sections (no registry)
            _.map(ouList, function (ou) {
                if (ou.hasRegistry) {
                    // To show (regou - section), append the dummy property "tempRegOUSection"
                    ou.tempRegOUSection = new Information({
                        arName: ou.arName,
                        enName: ou.enName
                    });
                    regOus.push(ou);
                } else {
                    parentRegistryOu = (ou.regouId || ou.regOuId);
                    if (typeof parentRegistryOu === 'number') {
                        parentRegistryOu = _.find(ouList, function (ou) {
                            return ou.id === parentRegistryOu;
                        })
                    }
                    ou.tempRegOUSection = new Information({
                        arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + ou.arName,
                        enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + ou.enName
                    });

                    sections.push(ou);
                }
                return ou;
            });

            // sorting from BE based on user selection (alphabetical or by org structure)
            return [].concat(regOus, sections);
        };

        self.saveExternalDataSource = function ($event) {
            if (!self.isValidExternalDataSourceForm()) {
                _validateMetadataColumnsControl();
                return;
            }
            if (self.externalDataSource.id) {
                _updateExternalDataSource();
            } else {
                _addExternalDataSource();
            }
        }

        /**
         * @description Add new external data source
         */
        var _addExternalDataSource = function () {
            validationService
                .createValidation('ADD_EXTERNAL_DATA_SOURCE')
                .addStep('check_required', true, generator.checkRequiredFields, self.externalDataSource, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, externalDataSourceService.checkDuplicateExternalDataSource, [self.externalDataSource, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    externalDataSourceService
                        .addExternalDataSource(self.externalDataSource)
                        .then(function () {
                            dialog.hide(self.externalDataSource);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit external data source
         */
        var _updateExternalDataSource = function () {
            validationService
                .createValidation('EDIT_EXTERNAL_DATA_SOURCE')
                .addStep('check_required', true, generator.checkRequiredFields, self.externalDataSource, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, externalDataSourceService.checkDuplicateExternalDataSource, [self.externalDataSource, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    externalDataSourceService
                        .updateExternalDataSource(self.externalDataSource)
                        .then(function () {
                            dialog.hide(self.externalDataSource);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedUsers = function () {
            self.mappedUsers = $filter('orderBy')(self.mappedUsers, self.usersGrid.order);
        };

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.loadAppUsersForOU = function ($event) {
            self.userExtDataSource.userId = null;
            self.inProgress = true;
            if (!self.userExtDataSource.ouId) {
                self.applicationUsers = [];
                return;
            }
            return distributionWFService
                .searchUsersByCriteria({ou: self.userExtDataSource.ouId})
                .then(function (result) {
                    self.applicationUsers = result;
                    self.inProgress = false;
                    return result;
                });
        };

        /**
         * @description Checks if the user from selected ou is already added to external data source
         * @param appUser
         * @returns {boolean}
         */
        self.isExistingUser = function (appUser) {
            return !!(_.find(self.mappedUsers, function (mappedUser) {
                return mappedUser.userId === appUser.id && mappedUser.ouId === self.userExtDataSource.ouId;
            }));
        };

        /**
         * @description Get the sorting key for given property
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Loads the mapped users to external data source
         */
        self.reloadMappedUsers = function (pageNumber) {
            var defer = $q.defer();
            self.usersGrid.progress = defer.promise;
            return userExternalDataSourceService.loadUserExternalDataSourcesBySourceId(self.model.id)
                .then(function (result) {
                    self.mappedUsers = result;
                    self.mappedUsersCopy = angular.copy(self.mappedUsers);
                    self.selectedUsers = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.usersGrid.page = pageNumber;
                    self.getSortedUsers();
                    return result;
                });
        };

        /**
         * @description Delete the user external data source
         * @param $event
         * @param user
         * @returns {*}
         */
        self.removeUser = function ($event, user) {
            dialog.confirmMessage(langService.get('confirm_delete').change({name: user.ouInfo.getTranslatedName() + ' - ' + user.userInfo.getTranslatedName()}))
                .then(function () {
                    userExternalDataSourceService.deleteUserExternalDataSource(user).then(function () {
                        self.reloadMappedUsers().then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: user.ouInfo.getTranslatedName() + ' - ' + user.userInfo.getTranslatedName()}));
                        });
                    })
                });
        };

        self.showUserForm = function () {
            var defer = $q.defer();
            if (self.isOrgListLoaded) {
                defer.resolve(true);
            } else {
                organizationService.loadAllOrganizationsStructureView()
                    .then(function (result) {
                        self.ouList = result;
                        _mapRegOUSections(result);
                        self.isOrgListLoaded = true;
                        defer.resolve(true);
                    });
            }
            defer.promise.then(function () {
                self.userFormShown = true;
                self.userExtDataSource = new UserExtImportStore({
                    extImportStore: self.model
                });
                $timeout(function () {
                    self.userExternalDataSourceForm = $scope.userExternalDataSourceForm;
                })
            })
        };

        self.closeUserForm = function ($event) {
            self.userFormShown = false;
            self.userExtDataSource = null;
            self.userExternalDataSourceForm = null;
        };

        self.saveUserExternalDataSource = function ($event) {
            if (!self.isValidUserExternalDataSourceForm()) {
                return;
            }
            userExternalDataSourceService.saveUserExternalDataSource(self.userExtDataSource)
                .then(function (result) {
                    toast.success(langService.get('save_success'));
                    self.closeUserForm();
                    self.reloadMappedUsers();
                });
        }

        self.setCurrentTab = function (tabName) {
            tabName = tabName.hasOwnProperty('name') ? tabName.name : tabName;
            if (tabName === self.tabsData.basic.name) {
                self.selectedTab = tabName;
                self.selectedTabIndex = _getTabIndex(self.selectedTab);
                return;
            }
            var defer = $q.defer();

            if (self.tabsData[tabName].loaded) {
                defer.resolve(tabName);
            } else {
                if (!self.tabsData[tabName].callback) {
                    defer.resolve(tabName);
                } else {
                    self.tabsData[tabName].callback()
                        .then(function (result) {
                            defer.resolve(tabName);
                        });
                }
            }
            return defer.promise.then(function (tab) {
                self.selectedTab = tab;
                self.selectedTabIndex = _getTabIndex(self.selectedTab);
                self.tabsData[tab].loaded = true;
            });
        };

        function _getAvailableTabs() {
            var availableTabs = {};
            _.map(self.tabsData, function (item, key) {
                if (self.showTab(key)) {
                    availableTabs[key] = item;
                }
            });
            return availableTabs;
        }

        function _getTabIndex(tabName) {
            tabName = tabName.hasOwnProperty('name') ? tabName.name : tabName;
            var index = -1,
                tabFound = _.find(_getAvailableTabs(), function (tab, key) {
                    index++;
                    return key.toLowerCase() === tabName.toLowerCase();
                });
            return index;
        }

        self.showTab = function (tabName) {
            tabName = tabName.hasOwnProperty('name') ? tabName.name : tabName;
            return !(!self.tabsData.hasOwnProperty(tabName) || !self.tabsData[tabName].show);
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

        self.$onInit = function () {
            self.tabsData = {
                basic: {name: 'basic', show: true, loaded: true},
                users: {name: 'users', show: true, loaded: false, callback: self.reloadMappedUsers}
            };
            $timeout(function () {
                self.externalDataSourceForm = $scope.externalDataSourceForm;
            });
        }
    });
};
