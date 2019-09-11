module.exports = function (app) {
    app.service('g2gPendingService', function (urlService,
                                               $http,
                                               $q,
                                               generator,
                                               SentItemDepartmentInbox,
                                               cmsTemplate,
                                               dialog,
                                               moment) {
        'ngInject';
        var self = this;
        self.serviceName = 'g2gPendingService';

        self.g2gPendingItems = [];

        /**
         * @description Load the entity names from server.
         * @returns {Promise|g2gPendingItems}
         */
        self.loadG2gPendingItems = function (criteria) {
            var url = urlService.messagingHistory + '/pending';
            if (criteria && criteria.dateFrom && criteria.dateTo && criteria.mainSiteTo) {
                var criteriaCopy = angular.copy(criteria);
                criteriaCopy.mainSiteTo = criteriaCopy.mainSiteTo.hasOwnProperty('id') ? criteriaCopy.mainSiteTo.id : criteriaCopy.mainSiteTo;
                criteriaCopy.dateFrom = moment(criteriaCopy.dateFrom).startOf("day").format('YYYY-MM-DD hh:mm:ss');
                criteriaCopy.dateTo = moment(criteriaCopy.dateTo).endOf('day').format('YYYY-MM-DD hh:mm:ss');
                url = url + '?fDate=' + criteriaCopy.dateFrom + '&tDate=' + criteriaCopy.dateTo + '&siteToId=' + criteriaCopy.mainSiteTo;
            }
            return $http.get(url).then(function (result) {
                self.g2gPendingItems = generator.generateCollection(result.data.rs, SentItemDepartmentInbox, self._sharedMethods);
                self.g2gPendingItems = generator.interceptReceivedCollection('SentItemDepartmentInbox', self.g2gPendingItems);
                return self.g2gPendingItems;
            });
        };

        /**
         * @description Get entity names from self.g2gPendingItems if found and if not load it from server again.
         * @returns {Promise|g2gPendingItems}
         */
        self.getG2gPendingItems = function () {
            return self.g2gPendingItems.length ? $q.when(self.g2gPendingItems) : self.loadG2gPendingItems();
        };


        self.openPendingItemsFilterDialog = function (criteria, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('g2g-pending-filter'),
                    targetEvent: event,
                    bindToController: true,
                    controller: 'g2gPendingFilterPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        criteria: angular.copy(criteria)
                    },
                    resolve: {
                        g2gMainSites: function (correspondenceViewService, configurationService) {
                            'ngInject';
                            return correspondenceViewService.correspondenceSiteSearch('main', {
                                type: configurationService.G2G_CORRESPONDENCE_SITES_TYPE,
                                criteria: null,
                                excludeOuSites: false
                            });
                        }
                    }
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteG2gPending, self.updateG2gPending);
    });
};
