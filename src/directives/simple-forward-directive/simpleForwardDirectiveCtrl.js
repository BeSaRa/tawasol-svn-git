module.exports = function (app) {
    app.controller('simpleForwardDirectiveCtrl', function (langService,
                                                           $scope,
                                                           userCommentService,
                                                           employeeService,
                                                           $timeout,
                                                           DistributionWFItem,
                                                           DistributionWF,
                                                           _,
                                                           distributionWFService,
                                                           workflowActionService,
                                                           DistributionUserWFItem,
                                                           toast,
                                                           dialog,
                                                           LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'simpleForwardDirectiveCtrl';
        LangWatcher($scope);

        self.distWorkflowItem = new DistributionWFItem();
        self.distributionWF = new DistributionWF();
        self.selectedFavUsers = [];

        self.comment = null;
        self.commentSearchText = '';
        self.favoritesLimit = 10;

        $timeout(function () {
            self.favoriteUsers = _mapWFUser(self.favoriteUsers);
            self.record = self.workItem || self.correspondence;
            self.actionKey = self.record.hasActiveSeqWF() ? 'launch' : 'forward';

            self.favorites = {
                users: {
                    total: self.favoriteUsers.length,
                    expanded: false,
                    limit: self.favoritesLimit
                },
                actions: {
                    total: self.favoriteWorkFlowActions.length,
                    expanded: false,
                    limit: self.favoritesLimit
                }
            };
        })

        self.launchDistributionCorrespondenceWorkFlow = function () {
            self.distributionWF.setNormalUsers(_.filter(self.selectedFavUsers, _filterWFUsers));

            distributionWFService.startLaunchWorkflow(self.distributionWF, self.record, self.actionKey)
                .then(function (result) {
                    toast.success(langService.get('launch_success_distribution_workflow'));
                    dialog.hide();
                }).catch(function (error) {
            });
        }

        function _filterWFUsers(item) {
            return item.isUser();
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
         * @description set dist workflow Item properties.
         * @param distWorkflowItem
         * @param result
         * @private
         */
        function _setDistWorkflowItem(distWorkflowItem, result) {
            distWorkflowItem
                .setComments(result.comments)
                .setFavoriteAction(result.action)
        }

        function _setBulkDistWorkflowItems() {
            _.map(self.selectedFavUsers, function (item, index) {
                _setDistWorkflowItem(self.selectedFavUsers[index], self.distWorkflowItem);
            });
        }

        /**
         * @description when selected comment changed.
         */
        self.onCommentChange = function () {
            self.distWorkflowItem.comments = self.comment.getComment();
            _setBulkDistWorkflowItems();
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
         * @description Opens the add user comment(private and active)
         * @param $event
         */
        self.openAddUserCommentDialog = function ($event) {
            userCommentService.controllerMethod.userCommentAddDialog(employeeService.getEmployee().id, employeeService.getEmployee().getOUID(), $event)
                .then(function (userComment) {
                    self.comments.push(userComment);
                    self.comment = userComment;
                    self.onCommentChange();
                    // reload comments to use in user preference
                    userCommentService.loadUserComments();
                })
        };

        self.toggleFavoriteUser = function (favoriteUser) {
            favoriteUser.checked = !favoriteUser.checked;
            if (favoriteUser.checked) {
                self.selectedFavUsers.push(favoriteUser);
                _setBulkDistWorkflowItems();
            } else {
                var indexOfUser = _.findIndex(self.selectedFavUsers, {id: favoriteUser.id})
                self.selectedFavUsers.splice(indexOfUser, 1)
            }
        }

        self.toggleFavorites = function (expandFavoriteOf) {
            self.favorites[expandFavoriteOf].limit =
                self.favorites[expandFavoriteOf].expanded ? self.favoritesLimit : self.favorites[expandFavoriteOf].total;
            self.favorites[expandFavoriteOf].expanded = !self.favorites[expandFavoriteOf].expanded;
        }

        self.reloadFavoriteActions = function () {
            workflowActionService.loadFavoriteActions().then(function (result) {
                self.favoriteWorkFlowActions = result;
                self.favorites.actions.total = result.length;
            });
        }

        self.openAddUserFavoriteActionDialog = function ($event) {
            workflowActionService.openAddUserFavoriteActionDialog(self.favoriteWorkFlowActions, $event)
                .then(function () {
                    self.reloadFavoriteActions();
                })
        }

    });
};
