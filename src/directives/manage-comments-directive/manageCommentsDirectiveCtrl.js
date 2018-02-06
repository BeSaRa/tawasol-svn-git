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
                                                            $scope) {
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
        self.currentPrivacy = true;

        self.includedIDs = null;
        self.excludedIDs = null;
        self.selectedIncludedIDs = [];
        self.selectedExcludedIDs = [];
        self.selectedDocumentComments = [];

        self.includedIDsSearch = null;
        self.excludedIDsSearch = null;

        self.document = null;


        // placeholders
        self.properties = {
            includedIDs: {
                property: 'selectedIncludedItem',
                reverse: 'excludedIDs'
            },
            excludedIDs: {
                property: 'selectedExcludedItem',
                reverse: 'includedIDs'
            }
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
                            return (self.documentComment.includedIDs.length + 2)
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
                            return (self.documentComment.excludedIDs.length + 2)
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
                            return (self.documentComments.length + 2)
                        }
                    }
                ]
            }
        };

        // used when search for organizations|users.
        self.services = {
            users: {
                service: applicationUserService,
                method: 'findUsersByText',
                mapResult: function (item) {
                    return angular.extend(item, {display: item[langService.current + 'FullName']})
                }
            },
            organizations: {
                service: organizationService,
                method: 'findOrganizationsByText',
                mapResult: function (item) {
                    return angular.extend(item, {display: item[langService.current + 'Name']});
                }
            }
        };
        // private variables to debounce the request.
        var pendingSearch, cancelSearch = angular.noop, lastSearch;

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
                    promise.resolve(true);
                });

            } else {
                documentCommentService.addDocumentComment(self.documentComment).then(function () {
                    promise.resolve(true);
                });
            }

            promise.promise.then(function () {
                toast.success(langService.get('add_success').change({name: langService.get('comments_comment')}));
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
                    self.documentComments.splice(index, 1, documentComment);
                    toast.success(langService.get('update_success'));
                    self.model = angular.copy(self.documentComments);
                    self.closeDocumentComment();
                });
        };
        /**
         * @description toggle privacy for comment
         */
        self.toggleCommentPrivacy = function () {
            if (self.documentComment.isPrivate && (self.documentComment.includedIDs.length || self.documentComment.excludedIDs.length)) {
                dialog
                    .confirmMessage(langService.get('comments_confirm_include_exclude_remove'))
                    .then(function () {
                        self.documentComment.includedIDs = [];
                        self.documentComment.excludedIDs = [];
                    })
                    .catch(function () {
                        self.documentComment.isPrivate = !self.documentComment.isPrivate;
                    })
            } else if (self.documentComment.isGlobal && self.documentComment.includedIDs.length) {
                dialog
                    .confirmMessage(langService.get('comments_confirm_include_remove'))
                    .then(function () {
                        self.documentComment.includedIDs = [];
                    })
                    .catch(function () {
                        self.documentComment.isPrivate = !self.documentComment.isPrivate;
                    })
            }
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
                (!self.documentComment.commentPrivate() && self.documentComment.isPerOU && self.documentComment.withSubOUs) ||
                // if ig Global
                (self.documentComment.commentGlobal()) ||
                // if not global and not private and not pe ou
                (!self.documentComment.commentGlobal() && !self.documentComment.commentPrivate() && !self.documentComment.isPerOU) ||
                // if not global and not private
                (!self.documentComment.commentGlobal() && !self.documentComment.commentPrivate())
            );
        };
        /**
         * query to search for (organization|users) to (exclude|include).
         * @param property
         * @return {*}
         */
        self.querySearch = function (property) {
            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();
                var criteria = self[property + 'Search'];
                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;
                    var searchType = currentType();
                    var current = self.services[searchType];
                    $timeout(function () {
                        refreshDebounce();
                        current.service[current.method](criteria).then(function (result) {
                            var ids = _.map(self.documentComment[property], 'id');
                            var skipIdsFromSearchType = '';
                            if (property === 'excludedIDs')
                                skipIdsFromSearchType = 'includedIDs';
                            else
                                skipIdsFromSearchType = 'excludedIDs';
                            resolve(_.filter(_.map(result, current.mapResult), function (item) {
                                if ((searchType === 'users' && item.id === self.employee.id) || _.map(self.documentComment[skipIdsFromSearchType], 'id').indexOf(item.id) > -1) {
                                    return false;
                                }
                                return ids.indexOf(item.id) === -1;
                            }));
                        });
                    }, 500);
                });
            }
            return pendingSearch;
        };
        /**
         * @description search for includes.
         * @param criteria
         * @return {*}
         */
        self.querySearchIncludes = function (criteria) {
            return self.querySearch(criteria);
        };
        /**
         * @description for excludes.
         * @param criteria
         * @return {*}
         */
        self.querySearchExcludes = function (criteria) {
            return self.querySearch(criteria);
        };
        /**
         * @description to select (user|organization) for (include|exclude).
         * @param property
         * @param selected
         */
        self.selectItem = function (property, selected) {
            var key = self.properties[property];
            if (!selected) {
                return;
            }
            self.documentComment[property].push(selected);
            self[property] = null;
        };
        /**
         * @description remove include (user|organization)
         * @param property
         * @param $index
         * @param $event
         */
        self.removeInclude = function (property, $index, $event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: self.documentComment[property][$index].display}), null, null, $event)
                .then(function () {
                    self.documentComment[property].splice($index, 1);
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
                    var ids = _.map(self[selected], 'id');
                    self.documentComment[property] = _.filter(self.documentComment[property], function (item) {
                        return ids.indexOf(item.id) === -1;
                    });
                    self[selected] = [];
                });
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
                });
        };
        /**
         * @description to show documentCommentForm.
         */
        self.showDocumentCommentForm = function () {
            self.showCommentForm = true;
            self.selectedDocumentComments = [];
            self.editMode = false;
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
         * @description expose controller methods to parent Controller just in case the directive opend from dialog.
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

        self.isValidComment = function () {
            if (self.documentComment.isPrivate) {
                return true;
            }
            else {
                if (self.documentComment.isGlobal) {
                    return true;
                }
                else {
                    return (self.documentComment.includedIDs.length && self.documentComment.excludedIDs.length);
                }
            }
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
    });
};