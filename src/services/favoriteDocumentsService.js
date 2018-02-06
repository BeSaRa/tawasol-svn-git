module.exports = function (app) {
    app.service('favoriteDocumentsService', function (urlService,
                                                      $http,
                                                      $q,
                                                      generator,
                                                      correspondenceService,
                                                      _,
                                                      dialog,
                                                      langService,
                                                      toast,
                                                      Correspondence,
                                                      employeeService) {
        'ngInject';
        var self = this;
        self.serviceName = 'favoriteDocumentsService';

        self.favoriteDocuments = [];
        self.totalCount = 0;

        /**
         * @description Load the favorite documents from server.
         * @returns {Promise|favoriteDocuments}
         */
        self.loadFavoriteDocuments = function (page, limit) {
            var offset = ((page - 1) * limit);

            return $http.get(urlService.favoriteDocuments + '/user/docs', {
                params: {
                    offset: offset,
                    limit: limit
                }
            }).then(function (result) {
                self.favoriteDocuments = correspondenceService.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
                self.totalCount = result.data.count;
                return self.favoriteDocuments;
            });
            /*return $http.get(urlService.favoriteDocuments + '/user/docs?offset=0&limit=100').then(function (result) {
                self.favoriteDocuments = correspondenceService.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
                return self.favoriteDocuments;
            });*/
        };

        /**
         * @description Get favorite documents from self.favoriteDocuments if found and if not load it from server again.
         * @returns {Promise|favoriteDocuments}
         */
        self.getFavoriteDocuments = function (page, limit) {
            return self.favoriteDocuments.length ? $q.when(self.favoriteDocuments) : self.loadFavoriteDocuments(page, limit);
        };

        /**
         * @description Contains methods for CRUD operations for favorite documents
         */
        self.controllerMethod = {
            /**
             * @description Add the item to favorite documents
             * @param vsId
             * @param $event
             */
            favoriteDocumentAdd: function (vsId, $event) {
                return self.addToFavoriteDocuments(vsId)
                    .then(function (result) {
                        return result;
                    });
            },
            /**
             * @description Show confirm box and remove document from favorite documents
             * @param favoriteDocument
             * @param $event
             */
            favoriteDocumentRemove: function (favoriteDocument, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: favoriteDocument.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeFromFavoriteDocument(favoriteDocument).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: favoriteDocument.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove document from favorite documents
             * @param favoriteDocuments
             * @param $event
             */
            favoriteDocumentRemoveBulk: function (favoriteDocuments, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function (result) {
                        return self.removeBulkFromFavoriteDocuments(favoriteDocuments).then(function (result) {
                            var response = false;
                            if (result.length === favoriteDocuments.length) {
                                toast.error(langService.get("failed_remove_selected_from_favorite"));
                                response = false;
                            }
                            else if (result.length) {
                                generator.generateFailedBulkActionRecords('remove_from_favorite_documents_success_except_following', _.map(result, function (favoriteDocument) {
                                    return favoriteDocument.getNames();
                                }));
                                response = true;
                            }
                            else {
                                toast.success(langService.get("remove_from_favorite_documents_success"));
                                response = true;
                            }
                            return response;
                        });
                    });
            }
        };

        /**
         * @description Get favorite document by favoriteDocumentId
         * @param favoriteDocumentId
         * @returns {FavoriteDocument|undefined} return FavoriteDocument Model or undefined if not found.
         */
        self.getFavoriteDocumentById = function (favoriteDocumentId) {
            favoriteDocumentId = favoriteDocumentId instanceof Correspondence ? favoriteDocumentId.id : favoriteDocumentId;
            return _.find(self.favoriteDocuments, function (favoriteDocument) {
                return Number(favoriteDocument.id) === Number(favoriteDocumentId);
            });
        };


        /**
         * @description Add an item to favorite documents
         * @param vsId
         */
        self.addToFavoriteDocuments = function (vsId) {
            var data = {
                documentVSId: vsId,
                applicationUserId: employeeService.getEmployee().id
            };
            return $http
                .post((urlService.favoriteDocuments), data)
                .then(function (result) {
                    /* 4017 is an error code for duplicate entry */
                    if (!result.data.hasOwnProperty('rs') && result.data.hasOwnProperty('ec') && result.data.ec === 4017) {
                        return {status: false, message: "add_to_favorite_duplicate_record"};
                    }
                    return {status: true, message: "success"};
                })
        };

        /**
         * @description Remove an item from favorite documents
         * @param favoriteDocument
         */
        self.removeFromFavoriteDocument = function (favoriteDocument) {
            var vsId = favoriteDocument.hasOwnProperty('vsId') ? favoriteDocument.vsId : favoriteDocument;
            return $http.delete(urlService.favoriteDocuments + '/vsid/' + vsId).then(function (result) {
                return result;
            });
        };


        /**
         * @description remove bulk documents from favorite documents.
         * @param favoriteDocuments
         * @return {Promise|null}
         */
        self.removeBulkFromFavoriteDocuments = function (favoriteDocuments) {
            var bulkVsIds = favoriteDocuments[0].hasOwnProperty('vsId') ? _.map(favoriteDocuments, 'vsId') : favoriteDocuments;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.favoriteDocuments + '/vsid/bulk',
                data: bulkVsIds
            }).then(function (result) {
                result = result.data.rs;
                var failedFavoriteDocuments = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedFavoriteDocuments.push(key);
                });
                return _.filter(favoriteDocuments, function (favoriteDocument) {
                    return (failedFavoriteDocuments.indexOf(favoriteDocument.vsId) > -1);
                });
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteFavoriteDocument, self.updateFavoriteDocument);
    });
};
