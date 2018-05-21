module.exports = function (app) {
    app.service('g2gInboxService', function (urlService, 
                                                    $http , 
                                                    $q , 
                                                    generator,
                                                    G2G,
                                                    _,
                                                    dialog,
                                                    langService,
                                                    toast,
                                                    cmsTemplate) {
        var self = this;
        self.serviceName = 'g2gInboxService';
        
        self.g2gInboxes = [];

        /**
         * @description Load the g2g inbox items from server.
         * @returns {Promise|g2gInboxes}
         */
        self.loadG2gInboxes = function () {
            return $http.get(urlService.g2gInbox + 'getInboxByOU').then(function (result) {
                self.g2gInboxes = generator.generateCollection(result.data.rs, G2G, self._sharedMethods);
                self.g2gInboxes = generator.interceptReceivedCollection('G2G', self.g2gInboxes);
                return self.g2gInboxes;
            });
        };
        
        /**
         * @description Get g2g inbox items from self.g2gInboxes if found and if not load it from server again.
         * @returns {Promise|g2gInboxes}
         */
        self.getG2gInboxes = function () {
            return self.g2gInboxes.length ? $q.when(self.g2gInboxes) : self.loadG2gInboxes();
        };
        
        /**
         * @description Contains methods for CRUD operations for g2g inbox items
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new g2g inbox item
             * @param $event
             */
            g2gInboxAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('g-2-g-inbox'),
                        controller: 'g2gInboxPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            g2gInbox: new G2G(
                                {
                                    itemOrder: generator.createNewID(self.g2gInboxes, 'itemOrder')
                                }),
                            g2gInboxes: self.g2gInboxes
                        }
                    });
            },
            /**
             * @description Opens popup to edit g2g inbox item
             * @param g2gInbox
             * @param $event
             */
            g2gInboxEdit: function (g2gInbox, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('g-2-g-inbox'),
                        controller: 'g2gInboxPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            g2gInbox: g2gInbox,
                            g2gInboxes: self.g2gInboxes
                        }
                    });   
            },
            /**
             * @description Show confirm box and delete g2g inbox item
             * @param g2gInbox
             * @param $event
             */
            g2gInboxDelete: function (g2gInbox, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: g2gInbox.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteG2gInbox(g2gInbox).then(function(){
                            toast.show(langService.get("delete_specific_success").change({name: g2gInbox.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk g2g inbox items
             * @param g2gInboxes
             * @param $event
             */
            g2gInboxDeleteBulk: function (g2gInboxes, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkG2gInboxes(g2gInboxes)
                            .then(function (result) {
                                var response = false;
                                if(result.length === g2gInboxes.length){
                                    toast.show(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (g2gInbox) {
                                        return g2gInbox.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.show(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                         });
                    });
            }
        };
        
        /**
         * @description Add new g2g inbox item
         * @param g2gInbox
         * @return {Promise|G2gInbox}
         */
        self.addG2gInbox = function (g2gInbox) {
            return $http
                .post(urlService.g2gInbox,
                    generator.interceptSendInstance('G2gInbox', g2gInbox))
                .then(function () {
                    return g2gInbox;
                });
        };
        
        /**
         * @description Update the given g2g inbox item.
         * @param g2gInbox
         * @return {Promise|G2gInbox}
         */
        self.updateG2gInbox = function (g2gInbox) {
            return $http
                .put(urlService.g2gInbox,
                    generator.interceptSendInstance('G2gInbox', g2gInbox))
                .then(function () {
                    return g2gInbox;
                });
        };
        
        /**
         * @description Delete given g2g inbox item.
         * @param g2gInbox
         * @return {Promise|null}
         */
        self.deleteG2gInbox = function (g2gInbox) {
            var id = g2gInbox.hasOwnProperty('id') ? g2gInbox.id : g2gInbox;
            return $http.delete((urlService.g2gInbox + '/' + id));
        };
        
        /**
         * @description Delete bulk g2g inbox items.
         * @param g2gInboxes
         * @return {Promise|null}
         */
        self.deleteBulkG2gInboxes = function (g2gInboxes) {
            var bulkIds = g2gInboxes[0].hasOwnProperty('id') ? _.map(g2gInboxes, 'id') : g2gInboxes;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.g2gInbox + '/' + 'bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedG2gInboxes = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedG2gInboxes.push(key);
                });
                return _.filter(g2gInboxes, function (g2gInbox) {
                    return (failedG2gInboxes.indexOf(g2gInbox.id) > -1);
                });
            });
        };
        
        /**
         * @description Get g2g inbox item by g2gInboxId
         * @param g2gInboxId
         * @returns {G2gInbox|undefined} return G2gInbox Model or undefined if not found.
         */
        self.getG2gInboxById = function (g2gInboxId) {
            g2gInboxId = g2gInboxId instanceof G2G ? g2gInboxId.id : g2gInboxId;
            return _.find(self.g2gInboxes, function (g2gInbox) {
                return Number(g2gInbox.id) === Number(g2gInboxId);
            });
        };

        self.returnG2G = function(g2gInboxId){
            g2gInboxId = g2gInboxId instanceof G2G ? g2gInboxId.id : g2gInboxId;
        };

        self.receiveG2G = function(g2gCorrespondence){
            // intercept send instance for G2G
            g2gCorrespondence =  g2gCorrespondence instanceof G2G ? generator.interceptSendInstance('G2G', g2gCorrespondence) : g2gCorrespondence;
            // get correspondence from G2G object
            g2gCorrespondence = g2gCorrespondence.hasOwnProperty('correspondence') ? g2gCorrespondence.correspondence : g2gCorrespondence;
            return $http
                .put(urlService.g2gInbox + 'receive', g2gCorrespondence)
                .then(function (result) {
                    console.log(result);
                    return result;
                });
        };
        
        self.openG2G  = function(g2gCorrespondence){
            // intercept send instance for G2G
            //g2gCorrespondence =  g2gCorrespondence instanceof G2G ? generator.interceptSendInstance('G2G', g2gCorrespondence) : g2gCorrespondence;
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
