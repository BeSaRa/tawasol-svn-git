module.exports = function (app) {
    app.controller('rankCtrl', function (lookupService,
                                             rankService,
                                             ranks,
                                             $q,
                                             errorCode,
                                             langService,
                                             toast,
                                             contextHelpService,
                                             dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'rankCtrl';
        self.ranks = ranks;

        contextHelpService.setHelpTo('ranks');

        /**
         *@description All ranks
         */
        self.promise = null;
        self.selectedRanks = [];

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ranks.length + 21);
                    }
                }
            ]
        };
        /**
         *@description Contains methods for CRUD operations for ranks
         */
        self.statusServices = {
            'activate': rankService.activateBulkRanks,
            'deactivate': rankService.deactivateBulkRanks,
            'true': rankService.activateRank,
            'false': rankService.deactivateRank
        };

        /**
         * @description Opens dialog for add new rank
         * @param $event
         */
        self.openAddRankDialog = function ($event) {
            rankService
                .controllerMethod
                .rankAdd($event)
                .then(function (result) {
                    self.reloadRanks(self.grid.page).then(function () {
                        toast.success(langService.get('add_success').change({name: result.getNames()}));
                    });
                });
        };

        /**
         * @description Opens dialog for edit rank
         * @param $event
         * @param rank
         */
        self.openEditRankDialog = function (rank, $event) {
            rankService
                .controllerMethod
                .rankEdit(rank, $event)
                .then(function (result) {
                    self.reloadRanks(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                });
        };

        /**
         * @description Reload the grid of rank
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadRanks = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return rankService
                .loadRanks()
                .then(function (result) {
                    self.ranks = result;
                    self.selectedRanks = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single rank
         * @param rank
         * @param $event
         */
        self.removeRank = function (rank, $event) {
            rankService
                .controllerMethod
                .rankDelete(rank, $event)
                .then(function () {
                    self.reloadRanks(self.grid.page);
                })
                .catch(function (error) {
                    if (!error)
                        return;
                    errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                        dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                            lookup: langService.get('rank'),
                            used: langService.get('other_users')
                        }), null, null, $event);
                    });
                });
        };

        /**
         * @description Delete multiple selected ranks
         * @param $event
         */
        self.removeBulkRanks = function ($event) {
            rankService
                .controllerMethod
                .rankDeleteBulk(self.selectedRanks, $event)
                .then(function () {
                    self.reloadRanks(self.grid.page);
                });
        };

        /**
         * @description Change the status of rank from grid
         * @param rank
         */
        self.changeStatusRank = function (rank) {
            self.statusServices[rank.status](rank)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    rank.status = !rank.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        /**
         * @description Change the status of selected ranks
         * @param status
         */
        self.changeStatusBulkRanks = function (status) {
            self.statusServices[status](self.selectedRanks).then(function () {
                self.reloadRanks(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };
    });
};