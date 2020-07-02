module.exports = function (app) {
    app.controller('documentTypePopCtrl', function (documentTypeService,
                                                    _,
                                                    editMode,
                                                    toast,
                                                    DocumentType,
                                                    lookupService,
                                                    validationService,
                                                    generator,
                                                    dialog,
                                                    $timeout,
                                                    $q,
                                                    $scope,
                                                    langService,
                                                    ouApplicationUserService,
                                                    documentType,
                                                    documentClassFromUser,
                                                    gridService,
                                                    $filter,
                                                    defaultTabName) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentTypePopCtrl';
        self.editMode = editMode;
        self.documentType = angular.copy(documentType);
        self.model = angular.copy(self.documentType);
        self.privateDocumentType = null;

        self.documentTypeForm = null;

        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        self.documentTypes = documentTypeService.documentTypes;

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            lookupStrKey: 'document_class',
            itemOrder: 'item_order'
        };

        self.tabsToShow = [
            'basic',
            'security'
        ];

        self.showTab = function (tabName) {
            return (self.tabsToShow.indexOf(tabName) > -1);
        };

        function _getAvailableTabs() {
            return _.filter(self.tabsToShow, function (tab) {
                return self.showTab(tab);
            });
        }

        function _getTabIndex(tabName) {
            return _.findIndex(_getAvailableTabs(), function (tab) {
                return tab.toLowerCase() === tabName.toLowerCase();
            })
        }

        self.selectedTab = defaultTabName || 'basic';
        self.selectedTabIndex = _getTabIndex(self.selectedTab);

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            var defer = $q.defer();
            if (tabName === 'security') {
                self.reloadRelatedData()
                    .then(function (result) {
                        defer.resolve(tabName);
                    });
            } else {
                defer.resolve(tabName);
            }
            return defer.promise.then(function (tab) {
                self.selectedTab = tab;
                self.selectedTabIndex = _getTabIndex(self.selectedTab);
            });
        };

        /**
         * @description Check if option in dropdown is checked
         * @returns {boolean}
         */
        self.isChecked = function () {
            return !!(self.documentType.lookupStrKey && self.documentType.lookupStrKey.length === self.documentClasses.length);
        };

        /**
         * @description Check if some of options in dropdown are selected
         * @returns {boolean}
         */
        self.isIndeterminate = function () {
            return !!(self.documentType.lookupStrKey && self.documentType.lookupStrKey.length < self.documentClasses.length);
        };

        self.isDefaultDocumentClass = function (documentClass) {
            if (!!documentClassFromUser) {
                var isDefault = false;
                for (var i = 0; i < documentClassFromUser.length; i++) {
                    isDefault = documentClassFromUser[i].lookupStrKey.toLowerCase() === documentClass.lookupStrKey.toLowerCase();
                    if (isDefault)
                        break;
                }
                return isDefault;
            } else {
                return false;
            }
        };

        /**
         * @description Toggle the selection for options in dropdown
         * @param $event
         */
        self.toggleAll = function ($event) {
            if (self.documentType.lookupStrKey) {
                if (self.documentType.lookupStrKey.length === self.documentClasses.length) {
                    if (documentClassFromUser && documentClassFromUser.length) {
                        self.documentType.lookupStrKey = angular.copy(documentClassFromUser);
                    } else {
                        self.documentType.lookupStrKey = null;
                    }
                } else {
                    self.documentType.lookupStrKey = angular.copy(self.documentClasses);
                }
            } else {
                self.documentType.lookupStrKey = angular.copy(self.documentClasses);
            }
        };

        self.isValidDocumentType = function (form) {
            form = form || self.documentTypeForm;
            var isValid = form.$valid;
            if (!self.editMode) {
                return isValid;
            }
            if (!self.documentType.isGlobal) {
                isValid = isValid && self.documentType.relatedRecords && self.documentType.relatedRecords.length > 0;
            }

            return isValid;
        };

        self.saveDocumentType = function () {
            if (!self.isValidDocumentType()) {
                return;
            }
            (self.editMode) ? self.updateDocumentType() : self.addDocumentType();
        };

        /**
         * @description Add new document type
         */
        self.addDocumentType = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentTypeService.checkDuplicateDocumentType, [self.documentType, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.documentType, self.documentTypes, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    documentTypeService
                        .addDocumentType(self.documentType)
                        .then(function (result) {
                            dialog.hide(result);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Update document type
         */
        self.updateDocumentType = function () {
            validationService
                .createValidation('EDIT_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentType, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentTypeService.checkDuplicateDocumentType, [self.documentType, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.documentType, self.documentTypes, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    documentTypeService
                        .updateDocumentType(self.documentType)
                        .then(function () {
                            dialog.hide(self.documentType);
                        });
                })
                .catch(function () {

                });
        };


        self.getSortedRelatedData = function () {
            self.documentType.relatedRecords = $filter('orderBy')(self.documentType.relatedRecords, self.relatedDataGrid.order);
        };

        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        self.relatedDataGrid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.documentType.relatedRecords.length + 21);
                }
            }],
            pagingCallback: function (page, limit) {

            },
            searchColumns: {
                user: function (record) {
                    return self.getSortingKey('userInfo', 'Information');
                },
                organization: function (record) {
                    return self.getSortingKey('ouInfo', 'Information');
                }
            },
            searchText: '',
            searchCallback: function () {
                self.documentType.relatedRecords = gridService.searchGridData(self.relatedDataGrid, self.model.relatedRecords);
            }
        };

        /**
         * @description Handles the change of global property
         */
        self.onChangeGlobal = function () {
            if (!self.documentType.id) {
                self.documentType.isGlobal = true;
                return;
            }
            if (self.documentType.isGlobal) {
                if (self.documentType.relatedRecords && self.documentType.relatedRecords.length > 0) {
                    var relatedRecords = angular.copy(self.documentType.relatedRecords);
                    dialog.confirmMessage(langService.get('related_user_confirm'))
                        .then(function () {
                            self.documentType.isGlobal = true;
                            self.documentType.relatedRecords = [];
                        })
                        .catch(function () {
                            self.documentType.isGlobal = false;
                            self.documentType.relatedRecords = angular.copy(relatedRecords);
                        });
                } else {
                    self.documentType.isGlobal = true;
                    self.documentType.relatedRecords = [];
                }
            }
        };

        self.reloadRelatedData = function (pageNumber) {
            if (!self.documentType.id) {
                self.documentType.relatedRecords = [];
                self.model = angular.copy(self.documentType);
                return $q.resolve([]);
            }
            var defer = $q.defer();
            self.relatedDataGrid.progress = defer.promise;
            return documentTypeService.loadPrivateDocumentTypesByLookupKey(self.documentType)
                .then(function (result) {
                    self.documentType.relatedRecords = result;
                    self.model = angular.copy(self.documentType);
                    defer.resolve(true);
                    if (pageNumber)
                        self.relatedDataGrid.page = pageNumber;
                    self.getSortedRelatedData();
                    return result;
                })
        };

        function _checkExistingRelatedRecord(ouApplicationUser) {
            return !!(_.find(self.documentType.relatedRecords, function (item) {
                return item.getOuId() === ouApplicationUser.getOuId() && item.getUserId() === ouApplicationUser.getApplicationUserId();
            }));
        }

        /**
         * @description Opens dialog to add related data
         * @param $event
         */
        self.openAddRelatedDataDialog = function ($event) {
            ouApplicationUserService.controllerMethod
                .selectOUApplicationUsers([], 'select_users', $event, false, true)
                .then(function (ouApplicationUser) {
                    if (_checkExistingRelatedRecord(ouApplicationUser)) {
                        toast.info(langService.get('record_already_exists').change({entity: langService.get('user')}));
                        return;
                    }

                    self.documentType.setPrivateAndAddUser(ouApplicationUser)
                        .then(function (result) {
                            /*if (!self.documentType.hasOwnProperty('relatedRecords')) {
                                self.documentType.relatedRecords = [];
                            }
                            self.documentType.relatedRecords.push(result);
                            toast.success(langService.get('save_success'));*/

                            self.reloadRelatedData()
                                .then(function () {
                                    toast.success(langService.get('save_success'));
                                });
                        });
                })
        };

        /**
         * @description Delete the private document type
         * @param record
         * @param $event
         */
        self.deleteRelatedData = function (record, $event) {
            documentTypeService
                .controllerMethod
                .privateDocumentTypeDelete(record, $event)
                .then(function () {
                    self.reloadRelatedData(self.relatedDataGrid.page);
                })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };
        self.resetModel = function () {
            generator.resetFields(self.documentType, self.model);
        };

        self.$onInit = function () {
            $timeout(function () {
                self.documentTypeForm = $scope.documentTypeForm;
                if (self.editMode && !self.model.isGlobal) {
                    self.reloadRelatedData();
                }
            })
        }
    });
};
