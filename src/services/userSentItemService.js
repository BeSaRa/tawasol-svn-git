module.exports = function (app) {
    app.service('userSentItemService', function (urlService,
                                                 $http,
                                                 $q,
                                                 generator,
                                                 EventHistory) {
        'ngInject';
        var self = this;
        self.serviceName = 'userSentItemService';

        self.userSentItems = [];
        self.totalCount = 0;
        /**
         * @description Load the user sent items from server.
         * @returns {Promise|userSentItems}
         */
        self.loadUserSentItems = function (page, limit) {
            var offset = ((page - 1) * limit);

            return $http.get(urlService.userInboxSentItems, {
                params: {
                    offset: offset,
                    limit: limit
                }
            }).then(function (result) {
                self.totalCount = result.data.count;
                self.userSentItems = generator.generateCollection(result.data.rs, EventHistory, self._sharedMethods);
                self.userSentItems = generator.interceptReceivedCollection('EventHistory', self.userSentItems);
                return self.userSentItems;
            });
        };

        /**
         * @description Get user sent items from self.userSentItems if found and if not load it from server again.
         * @returns {Promise|userSentItems}
         */
        self.getUserSentItems = function (page, limit) {
            return self.userSentItems.length ? $q.when(self.userSentItems) : self.loadUserSentItems(page, limit);
        };

        /**
         * @description Contains methods for CRUD operations for user sent items
         */
        self.controllerMethod = {};

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSentItem, self.updateSentItem);

        /**
         * @description recall single WorkItem again to user inbox.
         * @returns WorkItem status
         */

        self.recallSingleWorkItem = function (wobNumber,user,comment) {
            return $http
                .put((urlService.userInbox + '/' + wobNumber + '/reassign'), {
                    user: user,
                    comment: comment
                })
                .then(function (result) {
                    return result.data.rs;
                });
        };


    });
};
