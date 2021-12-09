module.exports = function (app) {
    app.service('documentStampService', function (urlService,
                                                  $http,
                                                  $q,
                                                  generator,
                                                  TawasolStamp,
                                                  _,
                                                  dialog,
                                                  employeeService,
                                                  langService,
                                                  toast,
                                                  cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'documentStampService';

        self.documentStamps = [];

        /**
         * @description Load the document stamps from server.
         * @param organizationId
         * @param withContent
         * @returns {Promise|documentStamps}
         */
        self.loadDocumentStamps = function (organizationId, withContent) {
            organizationId = generator.getNormalizedValue(organizationId, 'id');
            return $http.get(urlService.documentStamp + '/ou/' + organizationId, {
                params: {'with-content': withContent}
            }).then(function (result) {
                self.documentStamps = generator.generateCollection(result.data.rs, TawasolStamp, self._sharedMethods);
                self.documentStamps = generator.interceptReceivedCollection('TawasolStamp', self.documentStamps);
                return self.documentStamps;
            });
        };

        /**
         * @description Get document stamps from self.documentStamps if found and if not load it from server again.
         * @returns {Promise|documentStamps}
         */
        self.getDocumentStamps = function (organizationId) {
            return self.documentStamps.length ? $q.when(self.documentStamps) : self.loadDocumentStamps(organizationId);
        };

        /**
         * @description Get document stamp by document stamp id
         * @param documentStampId
         * @returns {TawasolStamp|undefined} return TawasolStamp Model or undefined if not found.
         */
        self.getDocumentStampById = function (documentStampId) {
            return _.find(self.documentStamps, function (documentStamp) {
                return Number(generator.getNormalizedValue(documentStamp, 'id')) === Number(generator.getNormalizedValue(documentStampId, 'id'));
            });
        };

        /**
         * @description Load document stamp by document stamp vsId
         * @param documentStampVsId
         * @returns {TawasolStamp|undefined} return TawasolStamp Model or undefined if not found.
         */
        self.loadDocumentStampByVsId = function (documentStampVsId) {
            documentStampVsId = generator.getNormalizedValue(documentStampVsId, 'vsId');
            return $http.get(urlService.documentStamp + '/vsid/' + documentStampVsId).then(function (result) {
                return generator.interceptReceivedInstance('TawasolStamp', generator.generateInstance(result.data.rs, TawasolStamp, self._sharedMethods));
            });
        };

        /**
         * @description Get document stamp by document stamp vsId
         * @param documentStampVsId
         * @returns {TawasolStamp|undefined} return TawasolStamp Model or undefined if not found.
         */
        self.getDocumentStampByVsId = function (documentStampVsId) {
            return _.find(self.documentStamps, function (documentStamp) {
                return generator.getNormalizedValue(documentStamp, 'vsId') === generator.getNormalizedValue(documentStampVsId, 'vsId');
            });
        };

        /**
         * @description Contains methods for CRUD operations for document stamps
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new document stamp
             * @param $event
             * @param ouId
             */
            documentStampAdd: function ($event, ouId) {
                return dialog
                    .showDialog({
                        targetEvent: $event || null,
                        templateUrl: cmsTemplate.getPopup('document-stamp'),
                        controller: 'documentStampPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            documentStamp: new TawasolStamp({
                                ou: generator.getNormalizedValue(ouId, 'id')
                            })
                        }
                    });
            },
            /**
             * @description Opens popup to edit document stamp
             * @param documentStamp
             * @param $event
             */
            documentStampEdit: function (documentStamp, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event || null,
                        templateUrl: cmsTemplate.getPopup('document-stamp'),
                        controller: 'documentStampPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true
                        },
                        resolve: {
                            documentStamp: function () {
                                'ngInject';
                                return self.loadDocumentStampByVsId(documentStamp);
                            }
                        }
                    });
            },
            /**
             * @description Show confirm box and delete document stamp
             * @param documentStamp
             * @param $event
             */
            documentStampDelete: function (documentStamp, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: documentStamp.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteDocumentStamp(documentStamp).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: documentStamp.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk document stamps
             * @param documentStamps
             * @param $event
             */
            documentStampDeleteBulk: function (documentStamps, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkDocumentStamps(documentStamps)
                            .then(function (result) {
                                var response = false;
                                if (result.length === documentStamps.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (documentStamp) {
                                        return documentStamp.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };

        /**
         * @description Add new document stamp
         * @param documentStamp
         * @param docStampFile
         * @return {Promise|TawasolStamp}
         */
        self.addDocumentStamp = function (documentStamp, docStampFile) {
            documentStamp = generator.interceptSendInstance('TawasolStamp', documentStamp);
            var form = new FormData();
            form.append('entity', JSON.stringify(documentStamp));
            form.append('content', docStampFile);
            return $http.post(urlService.documentStamp, form, {
                headers: {
                    'Content-Type': undefined
                }
            })
                .then(function (result) {
                    return documentStamp;
                });
        };

        /**
         * @description Update the given document stamp.
         * @param documentStamp
         * @param docStampFile
         * @return {Promise|TawasolStamp}
         */
        self.updateDocumentStamp = function (documentStamp, docStampFile) {
            documentStamp = generator.interceptSendInstance('TawasolStamp', documentStamp);
            var form = new FormData();
            form.append('entity', JSON.stringify(documentStamp));
            form.append('content', docStampFile);


            return $http
                .post(urlService.documentStamp + "/update", form, {
                    headers: {
                        'Content-Type': undefined
                    }
                })
                .then(function () {
                    return documentStamp;
                });
        };

        /**
         * @description Delete given document stamp.
         * @param documentStamp
         * @return {Promise|null}
         */
        self.deleteDocumentStamp = function (documentStamp) {
            return $http.delete((urlService.documentStamp + '/vsid/' + generator.getNormalizedValue(documentStamp, 'vsId')));
        };

        /**
         * @description Delete bulk document stamps.
         * @param documentStamps
         * @return {Promise|null}
         */
        self.deleteBulkDocumentStamps = function (documentStamps) {
            var bulkIds = documentStamps[0].hasOwnProperty('vsId') ? _.map(documentStamps, 'vsId') : documentStamps;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.documentStamp + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedDocumentStamps = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDocumentStamps.push(key);
                });
                return _.filter(documentStamps, function (documentStamp) {
                    return (failedDocumentStamps.indexOf(documentStamp.id) > -1);
                });
            });
        };

        /**
         * @description Activate document stamp
         * @param documentStamp
         */
        self.activateDocumentStamp = function (documentStamp) {
            return $http
                .put((urlService.documentStamp + '/activate/vsid/' + generator.getNormalizedValue(documentStamp, 'vsId')))
                .then(function () {
                    return documentStamp;
                });
        };

        /**
         * @description Deactivate document stamp
         * @param documentStamp
         */
        self.deactivateDocumentStamp = function (documentStamp) {
            return $http
                .put((urlService.documentStamp + '/deactivate/vsid/' + generator.getNormalizedValue(documentStamp, 'vsId')))
                .then(function () {
                    return documentStamp;
                });
        };

        /**
         * @description Activate bulk of document stamps
         * @param documentStamps
         */
        self.activateBulkDocumentStamps = function (documentStamps) {
            var bulkIds = documentStamps[0].hasOwnProperty('vsId') ? _.map(documentStamps, 'vsId') : documentStamps;
            return $http
                .put((urlService.documentStamp + '/activate/bulk'), bulkIds)
                .then(function () {
                    return documentStamps;
                });
        };

        /**
         * @description Deactivate bulk of document stamps
         * @param documentStamps
         */
        self.deactivateBulkDocumentStamps = function (documentStamps) {
            var bulkIds = documentStamps[0].hasOwnProperty('vsId') ? _.map(documentStamps, 'vsId') : documentStamps;
            return $http
                .put((urlService.documentStamp + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return documentStamps;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param documentStamp
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDocumentStamp = function (documentStamp, editMode) {
            var documentStampsToFilter = self.documentStamps;
            if (editMode) {
                documentStampsToFilter = _.filter(documentStampsToFilter, function (documentStampToFilter) {
                    return documentStampToFilter.id !== documentStamp.id;
                });
            }
            return _.some(_.map(documentStampsToFilter, function (existingDocumentStamp) {
                return existingDocumentStamp.docSubject.toLowerCase() === documentStamp.docSubject.toLowerCase()
                    || existingDocumentStamp.documentTitle.toLowerCase() === documentStamp.documentTitle.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        self.loadActiveStamps = function () {
            return $http.get(urlService.documentStamp + '/active/ou/' + employeeService.getEmployee().getOUID())
                .then(function (result) {
                    var stamps = generator.generateCollection(result.data.rs, TawasolStamp, self._sharedMethods);
                    return generator.interceptReceivedCollection('TawasolStamp', stamps);
                });
        };
        /**
         * @description return annotation image for specified annotation type
         * @param bookVsId
         * @param annotationType
         * @param docClassId
         * @param vsId
         * @returns {Blob}
         */
        self.loadAnnotationContent = function (bookVsId, annotationType, docClassId, vsId) {
            return $http.put(urlService.annotationContent, {
                bookVsId: bookVsId,
                annotationType: annotationType,
                docClassId: docClassId,
                vsId: vsId
            }, {
                responseType: 'blob'
            }).then(function (result) {
                return result.data;
            });
        };

        self.openKwtAlDiyarStampsDialog = function (workItem, event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('custom-stamps'),
                controller: function (_, stamps) {
                    'ngInject';
                    var ctrl = this;
                    ctrl.rows = _.chunk(stamps, 4);
                    ctrl.selectedStamp = null;
                    ctrl.repeatOption = false;
                    ctrl.inprogress = false;
                    /**
                     * @description to check if the given stamp selected or not.
                     * @param stamp
                     * @returns {null|boolean}
                     */
                    ctrl.isSelectedStamp = function (stamp) {
                        return ctrl.selectedStamp && ctrl.selectedStamp.vsId === stamp.vsId;
                    };
                    /**
                     * @description to make given stamp selected.
                     * @param stamp
                     */
                    ctrl.setSelectedStamp = function (stamp) {
                        ctrl.selectedStamp = stamp;
                    };
                    /**
                     * @description add stamp and close the Stamps dialog.
                     */
                    ctrl.addStamp = function () {
                        if (ctrl.inprogress) {
                            return;
                        }
                        ctrl.inprogress = true;

                        self.addKwtAlDiyarDigitalStamp(workItem, ctrl.selectedStamp)
                            .then(function () {
                                dialog.hide();
                            });
                    };
                    /**
                     * @description close Stamps dialog.
                     */
                    ctrl.closePopup = function () {
                        dialog.cancel();
                    }
                },
                controllerAs: 'ctrl',
                resolve: {
                    stamps: function (documentStampService) {
                        'ngInject';
                        return documentStampService.loadActiveStamps();
                    }
                }
            })
        };

        self.addKwtAlDiyarDigitalStamp = function (workItem, stamp) {
            var info = workItem.getInfo();
            return $http.put(urlService.kwtDigitalStamp.change({
                vsId: info.vsId,
                stampVsId: stamp.vsId
            }), null).then(function (result) {
                return result.data.rs;
            })
        }

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDocumentStamp, self.updateDocumentStamp);
    });
};
