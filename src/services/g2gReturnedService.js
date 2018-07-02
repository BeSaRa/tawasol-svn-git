module.exports = function (app) {
    app.service('g2gReturnedService', function (urlService,
                                                    $http , 
                                                    $q , 
                                                    generator,
                                                    G2GMessagingHistory,
                                                    _,
                                                    dialog,
                                                    langService,
                                                    toast,
                                                    cmsTemplate) {
        var self = this;
        self.serviceName = 'g2gReturnedService';
        
        self.g2gItems = [];

        /**
         * @description Load the g2g inbox items from server.
         * @returns {Promise|g2gItems}
         */
        self.loadG2gItems = function () {
            return $http.get(urlService.g2gInbox + 'getReturn').then(function (result) {
                self.g2gItems = generator.generateCollection(result.data.rs, G2GMessagingHistory, self._sharedMethods);
                self.g2gItems = generator.interceptReceivedCollection('G2GMessagingHistory', self.g2gItems);
                return self.g2gItems;
            });
        };
        
        /**
         * @description Get g2g inbox items from self.g2gItems if found and if not load it from server again.
         * @returns {Promise|g2gItems}
         */
        self.getG2gItems = function () {
            return self.g2gItems.length ? $q.when(self.g2gItems) : self.loadG2gItems();
        };

        /**
         * @description Get g2g item by g2gItemId
         * @param g2gItemId
         * @returns {G2G|undefined} return G2G Model or undefined if not found.
         */
        self.getG2gInboxById = function (g2gItemId) {
            g2gItemId = g2gItemId instanceof G2GMessagingHistory ? g2gItemId.correspondence.id : g2gItemId;
            return _.find(self.g2gItems, function (g2gItem) {
                return Number(g2gItem.id) === Number(g2gItemId);
            });
        };

        self.terminateG2G = function(g2gItemId){
            g2gItemId = g2gItemId instanceof G2GMessagingHistory ? g2gItemId.correspondence.id : g2gItemId;
        };

        self.resendG2G = function(g2gItemId){
            g2gItemId = g2gItemId instanceof G2GMessagingHistory ? g2gItemId.correspondence.id : g2gItemId;
        };

        self.openG2G  = function(g2gCorrespondence){
            // intercept send instance for G2GMessagingHistory
            //g2gCorrespondence =  g2gCorrespondence instanceof G2GMessagingHistory ? generator.interceptSendInstance('G2GMessagingHistory', g2gCorrespondence) : g2gCorrespondence;
            // get correspondence from G2G object

            return $http
                .post(urlService.g2gInbox + 'open', g2gCorrespondence )
                .then(function (result) {
                    console.log(result);
                    return result;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteG2gInbox, self.updateG2gInbox);       
    });
};
