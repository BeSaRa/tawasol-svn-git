module.exports = function (app) {
    app.service('rankService', function (urlService,
                                             $http,
                                             $q,
                                             generator,
                                             Rank,
                                             _,
                                             dialog,
                                             langService,
                                             toast,
                                             cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'rankService';

        self.ranks = [];

        /**
         * @description load ranks from server.
         * @returns {Promise|ranks}
         */
        self.loadRanks = function () {
            return $http.get(urlService.ranks).then(function (result) {
                self.ranks = generator.generateCollection(result.data.rs, Rank, self._sharedMethods);
                self.ranks = generator.interceptReceivedCollection('Rank', self.ranks);
                return self.ranks;
            });
        };
        /**
         * @description get ranks from self.ranks if found and if not load it from server again.
         * @returns {Promise|ranks}
         */
        self.getRanks = function () {
            return self.ranks.length ? $q.when(self.ranks) : self.loadRanks();
        };

        /**
         * @description Contains methods for CRUD operations for ranks
         */
        self.controllerMethod = {
            rankAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('rank'),
                        controller: 'rankPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            rank: new Rank(
                                {
                                    itemOrder: generator.createNewID(self.ranks, 'itemOrder')
                                }),
                            ranks: self.ranks
                        }
                    })
            },
            rankEdit: function (rank, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('rank'),
                        controller: 'rankPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            rank: angular.copy(rank)
                        }
                    })
            },
            rankDelete: function (rank, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: rank.getNames()}))
                    .then(function () {
                        return self.deleteRank(rank).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: rank.getNames()}));
                            return true;
                        })
                    });
            },
            rankDeleteBulk: function (ranks, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function (result) {
                        return self.deleteBulkRanks(ranks).then(function (result) {
                            var response = false;
                            if (result.length === ranks.length) {
                                toast.error(langService.get("failed_delete_selected"));
                                response = false;
                            }
                            else if (result.length) {
                                generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (rank) {
                                    return rank.getNames();
                                }));
                                response = true;
                            }
                            else {
                                toast.success(langService.get("delete_success"));
                                response = true;
                            }
                            return response;
                        });
                    });
            }
        };

        /**
         * @description add new rank
         * @param rank
         * @return {Promise|Rank}
         */
        self.addRank = function (rank) {
            return $http
                .post(urlService.ranks,
                    generator.interceptSendInstance('Rank', rank))
                .then(function (result) {
                    return generator.interceptReceivedInstance('Rank', generator.generateInstance(result.data.rs, Rank, self._sharedMethods));
                });
        };
        /**
         * @description make an update for given rank.
         * @param rank
         * @return {Promise|Rank}
         */
        self.updateRank = function (rank) {
            return $http
                .put(urlService.ranks,
                    generator.interceptSendInstance('Rank', rank))
                .then(function () {
                    return generator.interceptReceivedInstance('Rank', generator.generateInstance(rank, Rank, self._sharedMethods));
                });
        };
        /**
         * @description delete given rank.
         * @param rank
         * @return {Promise|null}
         */
        self.deleteRank = function (rank) {
            var id = rank.hasOwnProperty('id') ? rank.id : rank;
            return $http.delete(urlService.ranks + '/' + id).then(function(result){
                return result;
            });
        };

        /**
         * @description delete bulk ranks.
         * @param ranks
         * @return {Promise|null}
         */
        self.deleteBulkRanks = function (ranks) {
            var bulkIds = ranks[0].hasOwnProperty('id') ? _.map(ranks, 'id') : ranks;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.ranks + '/' + 'bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedRanks = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedRanks.push(key);
                });
                return _.filter(ranks, function (rank) {
                    return (failedRanks.indexOf(rank.id) > -1);
                });
            });
        };

        /**
         * @description get rank by rankId
         * @param rankId
         * @returns {Rank|undefined} return Rank Model or undefined if not found.
         */
        self.getRankById = function (rankId) {
            rankId = rankId instanceof Rank ? rankId.id : rankId;
            return _.find(self.ranks, function (rank) {
                return Number(rank.id) === Number(rankId)
            });
        };

        /**
         * @description activate rank
         * @param rank
         */
        self.activateRank = function (rank) {
            return $http
                .put((urlService.ranks + '/activate/' + rank.id))
                .then(function () {
                    return rank;
                });
        };

        /**
         * @description Deactivate rank
         * @param rank
         */
        self.deactivateRank = function (rank) {
            return $http
                .put((urlService.ranks + '/deactivate/' + rank.id))
                .then(function () {
                    return rank;
                });
        };

        /**
         * @description Activate bulk of ranks
         * @param ranks
         */
        self.activateBulkRanks = function (ranks) {
            return $http
                .put((urlService.ranks + '/activate/bulk'), _.map(ranks, 'id'))
                .then(function () {
                    return ranks;
                });
        };

        /**
         * @description Deactivate bulk of ranks
         * @param ranks
         */
        self.deactivateBulkRanks = function (ranks) {
            return $http
                .put((urlService.ranks + '/deactivate/bulk'), _.map(ranks, 'id'))
                .then(function () {
                    return ranks;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param rank
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateRank = function (rank, editMode) {
            var ranksToFilter = self.ranks;
            if (editMode) {
                ranksToFilter = _.filter(ranksToFilter, function (rankToFilter) {
                    return rankToFilter.id !== rank.id;
                });
            }
            return _.some(_.map(ranksToFilter, function (existingRank) {
                return existingRank.arName === rank.arName
                    || existingRank.enName.toLowerCase() === rank.enName.toLowerCase()
                    || existingRank.lookupStrKey.toLowerCase() === rank.lookupStrKey.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteRank, self.updateRank);

    });
};
