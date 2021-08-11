module.exports = function (app) {
    app.controller('favoriteActionsPopCtrl', function (langService,
                                                       dialog,
                                                       favoriteWFActions,
                                                       $filter,
                                                       workflowActionService,
                                                       favActions,
                                                       _) {
        'ngInject';
        var self = this;
        self.controllerName = 'favoriteActionsPopCtrl';

        self.favoriteWFActions = favoriteWFActions;
        self.selectedFavoriteWFActionIds = _.map(favActions, 'actionId');

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.favoriteWFActions.length + 21)
                    }
                }
            ]
        }

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.favoriteWFActions = $filter('orderBy')(self.favoriteWFActions, self.grid.order);
        };

        self.toggleBulkFavorites = function () {
            var checked = self.isAllInFavorites();
            _.map(self.favoriteWFActions, function (action) {
                action.checked = !checked;
                _toggleFavorite(action);
                return action
            });
        }

        self.isAllInFavorites = function () {
            return _.every(self.favoriteWFActions, function (action) {
                return action.hasOwnProperty('checked') && action.checked;
            })
        }

        self.toggleFavorite = function (action) {
            action.checked = !action.checked;
            _toggleFavorite(action);
        }

        function _toggleFavorite(action) {
            var indexOfAction = self.selectedFavoriteWFActionIds.indexOf(action.id);
            if (action.checked) {
                if (indexOfAction === -1) {
                    self.selectedFavoriteWFActionIds.push(action.id);
                }
            } else {
                self.selectedFavoriteWFActionIds.splice(indexOfAction, 1)
            }
        }

        self.saveFavoriteActions = function () {
            workflowActionService.favoriteActions(self.selectedFavoriteWFActionIds)
                .then(function () {
                    dialog.hide();
                });
        }

        function _setFavoriteActions() {
            _.map(self.favoriteWFActions, function (action) {
                if (self.selectedFavoriteWFActionIds.indexOf(action.id) > -1)
                    action.checked = true;
            })
        }

        self.closePopup = function () {
            dialog.cancel();
        }

        _setFavoriteActions();
    })
}
