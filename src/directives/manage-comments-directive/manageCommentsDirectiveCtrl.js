module.exports = function (app) {
    app.controller('manageCommentsDirectiveCtrl', function (LangWatcher,
                                                            dialog,
                                                            langService,
                                                            employeeService,
                                                            toast,
                                                            $q,
                                                            $timeout,
                                                            applicationUserService,
                                                            organizationService,
                                                            documentCommentService,
                                                            DocumentComment,
                                                            $scope,
                                                            cmsTemplate,
                                                            Information,
                                                            ouApplicationUserService,
                                                            $filter,
                                                            _,
                                                            printService,
                                                            generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCommentsDirectiveCtrl';
        LangWatcher($scope);
        // default comment form
        self.editMode = false;
        // if true form will appear and else.
        self.showCommentForm = false;
        // true in case ot directive work from dialog.
        self.fromDialog = false;
        // current documentComment if edit or add.
        self.documentComment = null;
        // current employee
        self.employee = employeeService.getEmployee();
        self.employeeService = employeeService;

        self.includedIDs = null;
        self.excludedIDs = null;
        self.selectedIncludedIDs = [];
        self.selectedExcludedIDs = [];
        self.selectedDocumentComments = [];

        self.includedIDsSearch = null;
        self.excludedIDsSearch = null;

        self.document = null;

        self.commentPrivacies = [
            {
                text: langService.get('comments_global'),
                value: 'isGlobal'
            },
            {
                text: langService.get('comments_private'),
                value: 'isPrivate'
            },
            {
                text: langService.get('comments_customize'),
                value: 'isCustomize'
            }
        ];

        // placeholders
        /*self.properties = {
            includedIDs: {
                property: 'selectedIncludedItem',
                reverse: 'excludedIDs'
            },
            excludedIDs: {
                property: 'selectedExcludedItem',
                reverse: 'includedIDs'
            }
        };*/

        function _sortRegOusSections(organizations) {
            // filter all regOU (has registry)
            var regOus = _.filter(organizations, function (item) {
                    return item.hasRegistry;
                }),
                // filter all sections (no registry)
                sections = _.filter(organizations, function (ou) {
                    return !ou.hasRegistry;
                }),
                // registry parent organization
                parentRegistryOu;

            // To show (regou - section), append the dummy property "display"
            regOus = _.map(regOus, function (regOu) {
                regOu.display = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });

            sections = _.map(sections, function (item) {
                if (item.hasOwnProperty('registryParentId') && item.registryParentId) {
                    parentRegistryOu = item.registryParentId;
                } else if (item.hasOwnProperty('regouId') && item.regouId) {
                    parentRegistryOu = item.regouId;
                }
                if (typeof parentRegistryOu === 'number') {
                    parentRegistryOu = _.find(regOus, {'id': parentRegistryOu});
                }
                item.display = new Information({
                    arName: (parentRegistryOu ? parentRegistryOu.arName : '') + ' - ' + item.arName,
                    enName: (parentRegistryOu ? parentRegistryOu.enName : '') + ' - ' + item.enName
                });
                return item;
            });

            // sort regOu-section
            return _.sortBy([].concat(regOus, sections), [function (ou) {
                return ou.display[langService.current + 'Name'].toLowerCase();
            }]);
        }

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function (property) {
            self.documentComment[property] = $filter('orderBy')(self.documentComment[property], self.grid[property].order);
        };

        self.getSortingKey = function (property, modelType) {
            generator.getColumnSortingKey(property, modelType);
        };


        // for all grids in the directive.
        self.grid = {
            includedIDs: {
                limit: 10, // default limit
                page: 1, // first page
                order: 'display', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.documentComment.includedIDs.length + 21)
                        }
                    }
                ]
            },
            excludedIDs: {
                limit: 10, // default limit
                page: 1, // first page
                order: 'display', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.documentComment.excludedIDs.length + 21)
                        }
                    }
                ]
            },
            documentComments: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'shortDescription', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.documentComments.length + 21)
                        }
                    }
                ]
            }
        };

        // used when search for organizations|users.
        self.services = {
            users: {
                service: ouApplicationUserService,
                method: 'loadOuApplicationUserByOu',
                param: null,
                mapResult: function (item) {
                    //var applicationUser = angular.extend(item, {display: item.applicationUser[langService.current + 'FullName']});
                    var applicationUser = angular.extend(item, {display: item.applicationUser});
                    return item.applicationUser;
                }
            },
            organizations: {
                service: organizationService,
                method: 'loadOrganizations',
                param: [true, true],
                //method: 'getOrganizationsByRegOU',
                //param: employeeService.getEmployee().getRegistryOUID(),
                mapResult: function (item) {
                    //return angular.extend(item, {display: item.display[langService.current + 'Name']});
                    return angular.extend(item, {display: item.display});
                }
            }
        };
        // private variables to debounce the request.
        var pendingSearch, cancelSearch = angular.noop, lastSearch;
        //self.selectedOu = _sortRegOusSections([self.services.organizations.mapResult(self.employee.userOrganization)])[0];
        self.selectedOu = self.services.organizations.mapResult(_sortRegOusSections([self.employee.userOrganization])[0]);

        /**
         * to refresh debounce (reset).
         */
        function refreshDebounce() {
            lastSearch = 0;
            pendingSearch = null;
            cancelSearch = angular.noop;
        }

        /**
         * Debounce if querying faster than 300ms
         */
        function debounceSearch() {
            var now = new Date().getMilliseconds();
            lastSearch = lastSearch || now;

            return ((now - lastSearch) < 300);
        }

        /**
         * to get current type if user or organizations.
         * @return {string}
         */
        var currentType = function () {
            return self.documentComment.isPerOU ? 'organizations' : 'users';
        };
        /**
         * to get current search if user or organizations
         * @return {string}
         */
        self.currentSearchKey = function () {
            var type = currentType();
            return 'comments_search_in_' + type;
        };

        /**
         * @description to add comment for document
         */
        self.addDocumentCommentToDocument = function () {
            var promise = $q.defer();

            if (!self.vsId) {
                $timeout(function () {
                    self.documentComment.dummyCommentId = Date.now();
                    promise.resolve(true);
                });
            } else {
                documentCommentService.addDocumentComment(self.documentComment).then(function () {
                    promise.resolve(true);
                });
            }

            promise.promise.then(function () {
                toast.success(langService.get('add_success').change({name: langService.get('comments_comment')}));
                self.documentComment.createorInfo = new Information({
                    id: self.employee.id,
                    arName: self.employee.arFullName,
                    enName: self.employee.enFullName
                });
                self.documentComments.push(self.documentComment);
                self.model = angular.copy(self.documentComments);
                self.showCommentForm = false;
                self.documentComment = null;
            });
        };
        /**
         * @description save comment after edit
         */
        self.saveDocumentCommentToDocument = function () {
            var index = _.findIndex(self.documentComments, function (comment) {
                return comment.editIndex;
            });

            if (!self.vsId) {
                toast.success(langService.get('update_success'));
                delete self.documentComment.editIndex;
                self.documentComments.splice(index, 1, self.documentComment);
                self.closeDocumentComment();
                return true;
            }
            self.documentComment
                .update()
                .then(function (documentComment) {
                    index = _.findIndex(self.documentComments, function (comment) {
                        return comment.id === documentComment.id;
                    });

                    self.documentComments.splice(index, 1, documentComment);
                    toast.success(langService.get('update_success'));
                    self.model = angular.copy(self.documentComments);
                    self.closeDocumentComment();
                });
        };

        /**
         * @description On Change privacy
         */
        self.onCommentPrivacyChange = function () {
            self.checkCommentPrivacy();
            _setCommentPrivacy();
        };

        var _setCommentPrivacy = function () {
            switch (self.commentPrivacy) {
                case 'isGlobal':
                    self.documentComment.isGlobal = true;
                    self.documentComment.isPrivate = false;
                    break;
                case 'isPrivate':
                    self.documentComment.isGlobal = false;
                    self.documentComment.isPrivate = true;
                    break;
                default:
                    self.documentComment.isGlobal = false;
                    self.documentComment.isPrivate = false;
                    break;
            }
        };

        /**
         * @description check change of privacy for comment
         */
        self.checkCommentPrivacy = function () {
            if (self.commentPrivacy === 'isPrivate' && (self.documentComment.includedIDs.length || self.documentComment.excludedIDs.length)) {
                dialog
                    .confirmMessage(langService.get('comments_confirm_include_exclude_remove'))
                    .then(function () {
                        self.documentComment.includedIDs = [];
                        self.documentComment.excludedIDs = [];
                        self.commentPrivacyCopy = self.commentPrivacy;
                    })
                    .catch(function () {
                        self.commentPrivacy = self.commentPrivacyCopy;
                        _setCommentPrivacy();
                    })
            } else if (self.commentPrivacy === 'isGlobal' && self.documentComment.includedIDs.length) {
                dialog
                    .confirmMessage(langService.get('comments_confirm_include_remove'))
                    .then(function () {
                        self.documentComment.includedIDs = [];
                        self.commentPrivacyCopy = self.commentPrivacy;
                    })
                    .catch(function () {
                        self.commentPrivacy = self.commentPrivacyCopy;
                        _setCommentPrivacy();
                    })
            } else if (self.documentComment.withSubOUs && self.commentPrivacy === 'isCustomize' && self.documentComment.excludedIDs.length) {
                dialog
                    .confirmMessage(langService.get('comments_confirm_exclude_remove'))
                    .then(function () {
                        self.documentComment.excludedIDs = [];
                        self.commentPrivacyCopy = self.commentPrivacy;
                    })
                    .catch(function () {
                        self.commentPrivacy = self.commentPrivacyCopy;
                        _setCommentPrivacy();
                    })
            } else
                self.commentPrivacyCopy = self.commentPrivacy;
        };

        /**
         * @description toggle commentPerOu
         * @param $event
         */
        self.toggleCommentPerOUStatus = function ($event) {
            if (!self.documentComment.includedIDs.length && !self.documentComment.excludedIDs.length) {
                return;
            }
            var oldSelectedType = self.documentComment.isPerOU ? 'comments_users' : 'comments_organizations';
            var message = langService.get('comments_confirm_per_organization_change').change({type: langService.get(oldSelectedType)});
            dialog
                .confirmMessage(message, null, null, $event)
                .then(function () {
                    self.documentComment.includedIDs = [];
                    self.documentComment.excludedIDs = [];
                })
                .catch(function () {
                    self.documentComment.isPerOU = !self.documentComment.isPerOU;
                });
        };

        /**
         * @description toggle withSubOus
         * @param $event
         */
        self.toggleCommentWithSubOUs = function ($event) {
            if (!self.documentComment.excludedIDs.length || self.commentPrivacy !== 'isCustomize') {
                return;
            }
            dialog
                .confirmMessage(langService.get('comments_confirm_exclude_remove'), null, null, $event)
                .then(function () {
                    self.documentComment.excludedIDs = [];
                })
                .catch(function () {
                    self.documentComment.withSubOUs = !self.documentComment.withSubOUs;
                });
        };

        /**
         * @description to check if current document comment can include (organization|users) or not.
         * @return {boolean}
         */
        self.canInclude = function () {
            // if document is Private
            return !self.documentComment.commentPrivate() && !self.documentComment.commentGlobal();
        };
        /**
         * @description to close the documentComment form and popup if no self.documentComment
         */
        self.closeDocumentComment = function () {
            self.documentComment = null;
            self.commentPrivacy = null;
            self.editMode = false;
            if (self.fromDialog && !self.showCommentForm) {
                dialog.cancel(self.model);
            } else {
                self.showCommentForm = false;
            }
        };
        /**
         * @description to check if current documentComment can Exclude (organization|users) or not.
         * @return {boolean|*}
         */
        self.canExclude = function () {
            return (
                // if not private comment and isPerOU and withSubOUs active
                // (!self.documentComment.commentPrivate() && self.documentComment.isPerOU && self.documentComment.withSubOUs) ||
                // if ig Global
                (self.documentComment.commentGlobal()) ||
                // if not global and not private and not user type
                (self.documentComment.commentCustomize() && self.documentComment.isPerOU && self.documentComment.withSubOUs && self.documentComment.excludedIDs.length) /*||
                // if not private and not global and not with subOUs selected and excludedIDs have length
                (self.documentComment.commentCustomize() && self.documentComment.excludedIDs.length && self.documentComment.withSubOUs)*/
            );
        };

        /**
         * @description search for includes.
         * @param criteria
         * @return {*}
         */
        self.querySearchIncludes = function (criteria) {
            if (!self.documentComment.isPerOU)
                return self.querySearch(criteria, self.selectedOu);
            return self.querySearch(criteria);
        };
        /**
         * @description for excludes.
         * @param criteria
         * @return {*}
         */
        self.querySearchExcludes = function (criteria) {
            if (!self.documentComment.isPerOU)
                return self.querySearch(criteria, self.selectedOu);
            return self.querySearch(criteria);
        };

        /**
         *  query to search for (organization|users) to (exclude|include).
         * client side search
         * @param property
         * @param selectedOu
         * @return {*}
         */
        self.querySearch = function (property, selectedOu) {
            var criteria = self[property + 'Search'];
            var searchType = currentType();
            var current = self.services[searchType];
            var param = selectedOu ? selectedOu : self.services[searchType].param;

            // var method = (param) ? current.service[current.method](param) : current.service[current.method](param);
            if (param && !angular.isArray(param)) {
                param = [param];
            }
            var method = (param.length) ? current.service[current.method].apply(current.service, param) : current.service[current.method]();

            return method.then(function (result) {
                if (searchType === 'organizations') {
                    result = _sortRegOusSections(result);
                }
                var ids = _.map(self.documentComment[property], 'id');

                return _.filter(result, function (item) {
                    item = self.services[searchType].mapResult(item);
                    var skipIdsFromSearchType = '';
                    if (property === 'excludedIDs')
                        skipIdsFromSearchType = 'includedIDs';
                    else
                        skipIdsFromSearchType = 'excludedIDs';

                    if (!criteria)
                        return ids.indexOf(item.id) === -1 &&
                            _.map(self.documentComment[skipIdsFromSearchType], 'id').indexOf(item.id) === -1;

                    criteria = criteria.toLowerCase();
                    return item.getTranslatedName().toLowerCase().indexOf(criteria) !== -1 && ids.indexOf(item.id) === -1 &&
                        _.map(self.documentComment[skipIdsFromSearchType], 'id').indexOf(item.id) === -1;
                });
            });
        };

        self.querySearchOrganization = function (searchText) {
            searchText = searchText ? searchText.toLowerCase() : '';
            //return self.services.organizations.service[self.services.organizations.method](self.services.organizations.param)
            return self.services.organizations.service[self.services.organizations.method].apply(self.services.organizations.service, (self.services.organizations.param))
                .then(function (organizations) {
                    organizations = _sortRegOusSections(organizations);
                    return searchText ? _.filter(organizations, function (item) {
                        return item.display[langService.current + 'Name'].toLowerCase().indexOf(searchText) !== -1;
                    }) : organizations;
                })
        };


        /**
         * @description to select (user|organization) for (include|exclude).
         * @param property
         * @param selected
         */
        self.selectItem = function (property, selected) {
            //var key = self.properties[property];
            if (!selected) {
                return;
            }
            self.documentComment[property].push((self.documentComment.isPerOU) ? selected : selected.applicationUser);
            self[property] = null;
        };
        /**
         * @description remove include (user|organization)
         * @param property
         * @param $index
         * @param selected
         * @param $event
         */
        self.removeInclude = function (property, $index, selected, $event) {
            if (self.documentComment.commentCustomize() && property === 'includedIDs' && self.documentComment.isPerOU && self.documentComment.withSubOUs &&
                self.documentComment.excludedIDs.length) {

                dialog
                    .confirmMessage(langService.get('confirm_delete_selected_with_excluded_sub_ou'), null, null, $event)
                    .then(function () {
                        _removeInclude(property, selected, $event);
                    });
            } else {
                dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: self.documentComment[property][$index].getTranslatedName()}), null, null, $event)
                    .then(function () {
                        self.documentComment[property] = _.filter(self.documentComment[property], function (item) {
                            return item.id !== selected.id;
                        });
                    });
            }
        };

        var _removeInclude = function (property, selected, $event) {
            // delete all children from excluded
            self.documentComment.excludedIDs = _.filter(self.documentComment.excludedIDs, function (excluded) {
                return excluded.parent !== selected.id;
            });

            // remove selected
            self.documentComment[property] = _.filter(self.documentComment[property], function (item) {
                return item.id !== selected.id;
            });
        };

        /**
         * @description remove bulk (organizations|users) from (includes|excludes)
         * @param property
         * @param selected
         * @param $event
         */
        self.removeBulkSelected = function (property, selected, $event) {
            dialog
                .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    _removeBulkSelected(property, selected, $event);
                    if (self.documentComment.commentCustomize() && property === 'includedIDs' && self.documentComment.isPerOU && self.documentComment.withSubOUs &&
                        self.documentComment.excludedIDs.length) {

                        _.map(self.documentComment[property], function (item) {
                            _removeInclude(property, item);
                        })
                    } else {
                        _removeBulkSelected(property, selected, $event);
                    }
                });
        };

        var _removeBulkSelected = function (property, selected, $event) {
            var ids = _.map(self[selected], 'id');
            self.documentComment[property] = _.filter(self.documentComment[property], function (item) {
                return ids.indexOf(item.id) === -1;
            });
            self[selected] = [];
        };

        /**
         * @description delete single documentComment.
         * @param documentComment
         * @param $event
         */
        self.removeDocumentComment = function (documentComment, $event) {
            var defer = $q.defer();
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: langService.get('comments_comment')}), null, null, $event)
                .then(function () {

                    if (self.vsId) {
                        documentComment.delete().then(function () {
                            defer.resolve(true);
                        });
                    } else {
                        $timeout(function () {
                            defer.resolve(true);
                        });
                    }

                    defer.promise.then(function () {
                        toast.success(langService.get('delete_success'));
                        self.documentComments.splice(self.documentComments.indexOf(documentComment), 1);
                        self.model = angular.copy(self.documentComments);
                    });


                });
        };
        /**
         * @description edit documentComment.
         * @param documentComment
         * @param $event
         */
        self.editDocumentComment = function (documentComment, $event) {
            documentComment.editIndex = true;
            self.documentComment = angular.copy(documentComment);
            self.commentPrivacy = _getCommentPrivacy(documentComment);
            self.editMode = true;
            self.showCommentForm = true;
        };
        /**
         * @description remove bulk documentComments.
         * @param $event
         */
        self.removeBulkDocumentComments = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    if (!self.editMode && !self.vsId) {
                        var ids = _.map(self.selectedDocumentComments, 'dummyCommentId');
                        self.documentComments = _.filter(self.documentComments, function (documentComment) {
                            return ids.indexOf(documentComment.dummyCommentId) === -1;
                        });
                        self.selectedDocumentComments = [];
                        toast.success(langService.get('delete_success'));
                        self.model = angular.copy(self.documentComments);
                    } else {
                        documentCommentService
                            .deleteBulkDocumentComments(self.selectedDocumentComments)
                            .then(function () {
                                var ids = _.map(self.selectedDocumentComments, 'id');
                                self.documentComments = _.filter(self.documentComments, function (documentComment) {
                                    return ids.indexOf(documentComment.id) === -1;
                                });
                                self.selectedDocumentComments = [];
                                toast.success(langService.get('delete_success'));
                                self.model = angular.copy(self.documentComments);
                            });
                    }
                });
        };

        /**
         * @description open dialog to exclude sub organizations from selected include
         * @param parentOrganization
         * @param $event
         * @returns {promise}
         */
        self.openExcludesDialog = function (parentOrganization, $event) {
            var excludedFromCurrentParent = _.filter(self.documentComment.excludedIDs, function (ou) {
                return ou.parent === parentOrganization.id;
            });
            var existingExludeIds = _.map(self.documentComment.excludedIDs, 'id'),
                existingIncludeIds = _.map(self.documentComment.includedIDs, 'id');
            return dialog.showDialog({
                $event: $event,
                templateUrl: cmsTemplate.getPopup('manage-excluded-sub-organizations-comment'),
                controller: 'manageExcludedSubOrganizationsCommentPopCtrl',
                controllerAs: 'ctrl',
                bindToController: true,
                locals: {
                    organization: parentOrganization,
                    excludedSubOUs: angular.copy(excludedFromCurrentParent)
                },
                resolve: {
                    organizationChildren: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizationChildren(parentOrganization, false)
                            .then(function (result) {
                                // remove current ou and existing exclude from child list
                                result = _.filter(result, function (ou) {
                                    return ou.id !== parentOrganization.id && existingExludeIds.indexOf(ou.id) === -1 && existingIncludeIds.indexOf(ou.id) === -1;
                                });
                                return result;
                            });
                    }
                }
            }).then(function (selectedExcludedSubOus) {
                var excludedFromCurrentParentIds = _.map(excludedFromCurrentParent, 'id');
                // remove old items for open dialog organization
                self.documentComment.excludedIDs = _.filter(self.documentComment.excludedIDs, function (item) {
                    return excludedFromCurrentParentIds.indexOf(item.id) === -1;
                });

                self.documentComment.excludedIDs = self.documentComment.excludedIDs.concat(selectedExcludedSubOus);
            });
        };


        /**
         * @description to show documentCommentForm.
         */
        self.showDocumentCommentForm = function () {
            self.showCommentForm = true;
            self.selectedDocumentComments = [];
            self.editMode = false;
            self.commentPrivacy = 'isGlobal';
            self.commentPrivacyCopy = self.commentPrivacy;
            self.documentComment = (new DocumentComment()).setVsId(self.vsId).setCreationDate();
            if (self.documentComment) {
                return;
            }
            self.documentComment = (new DocumentComment()).setVsId(self.vsId).setCreationDate();
        };
        /**
         * @description Popup to display commentDescription.
         * @param comment
         * @param $event
         */
        self.showComment = function (comment, $event) {
            $event.preventDefault();
            dialog
                .successMessage(comment.description, null, null, $event, true);
        };
        /**
         * @description expose controller methods to parent Controller just in case the directive opened from dialog.
         */
        $timeout(function () {
            if (self.fromDialog) {
                self.sourceCloseCallback = self.closeDocumentComment;
                self.sourceCreateCallback = self.addDocumentCommentToDocument;
                self.sourceSaveCallback = self.saveDocumentCommentToDocument;
                self.sourceEditMode = self.editMode;
                self.sourceComment = self.documentComment;
                self.model = angular.copy(self.documentComments);
                watchEditModeWhenFromDialogTrue();
            }
        });

        self.addCommentsAfterInsertDocument = function () {
            if (!self.documentComments.length)
                return;

            documentCommentService
                .addBulkDocumentComments(self.documentComments, self.vsId);
        };

        /**
         * @description this watcher will run when fromDialog= true to watch the editMode and documentComment.
         */
        function watchEditModeWhenFromDialogTrue() {
            $scope.$watch(function () {
                return self.editMode;
            }, function (newVal) {
                self.sourceEditMode = self.editMode;
            });

            $scope.$watch(function () {
                return self.documentComment;
            }, function (newVal) {
                self.sourceComment = self.documentComment;
            });
        }

        function watchAfterSaveDocument() {
            var saveWatcher = $scope.$watch(function () {
                return self.vsId;
            }, function (value) {
                if (!value)
                    return;
                self.addCommentsAfterInsertDocument();
                saveWatcher();
            })
        }

        $timeout(function () {
            if (!self.vsId) {
                watchAfterSaveDocument();
            }
        });

        self.documentCommentForm = 'documentCommentForm';

        self.validateComment = function () {
            if (self.documentComment.isPrivate) {
                return true;
            } else {
                if (self.documentComment.isGlobal) {
                    return true;
                } else {
                    return !!self.documentComment.includedIDs.length;
                }
            }
        };

        self.isValidComment = function (form) {
            var formValid = false;
            if (self.showCommentForm) {
                form = form || self.documentCommentForm;
                formValid = form && form.$valid && self.validateComment();
            }
            return formValid;

        };


        /**
         * @description Checks if the comment can be edited based on current user and creator and permission
         * @param documentComment
         * @returns {boolean}
         */
        self.allowEdit = function (documentComment) {
            /**
             * check if you have permission to edit all comments, show button
             * If no, check if you are creator, check your permission
             * otherwise hide the button
             */
            if (employeeService.hasPermissionTo("EDIT_ALL_DOCUMENT_COMMENTS"))
                return true;
            else if (self.employee.id === documentComment.creator || !documentComment.creator)
                return employeeService.hasPermissionTo('EDIT_DOCUMENT_COMMENT');
            else
                return false;
        };

        /**
         * @description Checks if the comment can be deleted based on current user and creator and permission
         * @param documentComment
         * @returns {boolean}
         */
        self.allowDelete = function (documentComment) {
            /**
             * check if you have permission to delete all comments, show button
             * If no, check if you are creator, check your permission
             * otherwise hide the button
             */
            if (employeeService.hasPermissionTo("DELETE_ALL_DOCUMENT_COMMENTS"))
                return true;
            else if (self.employee.id === documentComment.creator || !documentComment.creator)
                return employeeService.hasPermissionTo('DELETE_DOCUMENT_COMMENT');
            else
                return false;

        };

        self.printDocumentComments = function () {
            var documentCommentsCopy = self.documentComments;
            var info = self.correspondence.getInfo();
            info.createdOn =
                (self.correspondence.hasOwnProperty('generalStepElm')) ?
                    generator.getDateFromTimeStamp(self.correspondence.generalStepElm.documentCreationDate) :
                    self.correspondence.createdOn;

            _.map(documentCommentsCopy, function (documentComment) {
                documentComment.correspondence = info;
                return documentComment;
            });
            var printTitle = langService.get('comments_manage_document_comments'),
                headers = [
                    'comments_description',
                    'created_by',
                    'comments_creation_date',
                    'document_subject',
                    'serial_number',
                    'comment_date'
                ];

            printService
                .printData(documentCommentsCopy, headers, printTitle);
        };

        var _getCommentPrivacy = function (documentComment) {
            if (documentComment.commentGlobal()) {
                return 'isGlobal';
            } else if (documentComment.commentPrivate()) {
                return 'isPrivate';
            } else {
                return 'isCustomize';
            }
        }
    });
};
