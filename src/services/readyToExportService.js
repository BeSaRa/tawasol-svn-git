module.exports = function (app) {
    app.service('readyToExportService', function (urlService,
                                                  $http,
                                                  $q,
                                                  generator,
                                                  //ReadyToExport,
                                                  ReadyToExportOption,
                                                  rootEntity,
                                                  WorkItem,
                                                  _,
                                                  dialog,
                                                  langService,
                                                  toast,
                                                  tokenService,
                                                  $timeout,
                                                  cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'readyToExportService';

        self.readyToExports = [];


        /**
         * @description Load the ready To Exports from server.
         * @returns {Promise|readyToExports}
         */
        self.loadReadyToExports = function () {
            return $http.get(urlService.readyToExports).then(function (result) {
                self.readyToExports = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                self.readyToExports = generator.interceptReceivedCollection('WorkItem', self.readyToExports);
                return self.readyToExports;
            });
        };

        /**
         * @description Get ready To Exports from self.readyToExports if found and if not load it from server again.
         * @returns {Promise|readyToExports}
         */
        self.getReadyToExports = function () {
            return self.readyToExports.length ? $q.when(self.readyToExports) : self.loadReadyToExports();
        };

        /**
         * @description Contains methods for CRUD operations for ready To Exports
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new ready To Export
             * @param $event
             */
            readyToExportAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('ready-to-export'),
                        controller: 'readyToExportPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            readyToExport: new WorkItem(
                                {
                                    itemOrder: generator.createNewID(self.readyToExports, 'itemOrder')
                                }),
                            readyToExports: self.readyToExports
                        }
                    });
            },
            /**
             * @description Opens popup to edit ready To Export
             * @param readyToExport
             * @param $event
             */
            readyToExportEdit: function (readyToExport, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('ready-to-export'),
                        controller: 'readyToExportPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            readyToExport: readyToExport,
                            readyToExports: self.readyToExports
                        }
                    });
            },
            /**
             * @description Show confirm box and delete ready To Export
             * @param readyToExport
             * @param $event
             */
            readyToExportDelete: function (readyToExport, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: readyToExport.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteReadyToExport(readyToExport).then(function () {
                            toast.show(langService.get("delete_specific_success").change({name: readyToExport.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk ready To Exports
             * @param readyToExports
             * @param $event
             */
            readyToExportDeleteBulk: function (readyToExports, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkReadyToExports(readyToExports)
                            .then(function (result) {
                                var response = false;
                                if (result.length === readyToExports.length) {
                                    toast.show(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (readyToExport) {
                                        return readyToExport.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.show(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },
            /**
             * @description Star Ready To Export
             * @param readyToExport
             * @param $event
             */
            readyToExportStar: function (readyToExport, $event) {
                return self.starReadyToExport(readyToExport)
                    .then(function (result) {
                        return result;
                    })
            },
            /**
             * @description Star bulk Ready To Export items
             * @param readyToExport
             * @param $event
             */
            readyToExportStarBulk: function (readyToExport, $event) {
                return self.starBulkReadyToExport(readyToExport)
                    .then(function (result) {
                        var response = false;
                        if (result.length === readyToExport.length) {
                            toast.error(langService.get("failed_star_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('star_success_except_following', _.map(result, function (readyToExport) {
                                return readyToExport.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_star_success"));
                            response = true;
                        }
                        return response;
                    });
            },
            /**
             * @description Star Ready To Export
             * @param readyToExport
             * @param $event
             */
            readyToExportUnStar: function (readyToExport, $event) {
                return self.unStarReadyToExport(readyToExport)
                    .then(function (result) {
                        return result;
                    })
            },
            /**
             * @description Star bulk Ready To Export items
             * @param readyToExport
             * @param $event
             */
            readyToExportUnStarBulk: function (readyToExport, $event) {
                return self.unStarBulkUserInboxes(readyToExport)
                    .then(function (result) {
                        var response = false;
                        if (result.length === readyToExport.length) {
                            toast.error(langService.get("failed_unstar_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('unstar_success_except_following', _.map(result, function (readyToExport) {
                                return readyToExport.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_unstar_success"));
                            response = true;
                        }
                        return response;
                    });
            },
            /**
             * @description Terminate Ready To Export
             * @param readyToExport
             * @param $event
             * @param justReason
             */
            readyToExportTerminate: function (readyToExport, $event, justReason) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('reason'),
                        controller: 'reasonPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            justReason: justReason
                        },
                        resolve: {
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.getUserComments()
                                    .then(function (result) {
                                        return _.filter(result, 'status');
                                    });
                            }
                        }
                    }).then(function (reason) {
                        // to check if you need to return just the reason and no operation.
                        if (justReason)
                            return reason;

                        return self.terminateReadyToExport(readyToExport, reason)
                            .then(function () {
                                return true;
                            })
                    });
                /*return self.terminateReadyToExport(readyToExport)
                    .then(function (result) {
                        return true;
                    })*/
            },
            /**
             * @description Terminate bulk Ready To Export items
             * @param workItems
             * @param $event
             */
            readyToExportTerminateBulk: function (workItems, $event) {
                // if the selected workItem has just one record.
                if (workItems.length === 1)
                    return self.controllerMethod.readyToExportTerminate(workItems[0]);

                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('reason-bulk'),
                        controller: 'reasonBulkPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            workItems: workItems
                        },
                        resolve: {
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.getUserComments()
                                    .then(function (result) {
                                        return _.filter(result, 'status');
                                    });
                            }
                        }
                    })
                    .then(function (workItems) {
                        self.terminateBulkReadyToExport(workItems)
                            .then(function (result) {
                                var response = false;
                                if (result.length === workItems.length) {
                                    toast.error(langService.get("failed_terminate_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (readyToExport) {
                                        return readyToExport.getTranslatedName();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("selected_terminate_success"));
                                    response = true;
                                }
                                return response;
                            });

                    });


                /*return self.terminateBulkReadyToExport(readyToExport)
                    .then(function (result) {
                        var response = false;
                        if (result.length === readyToExport.length) {
                            toast.error(langService.get("failed_terminate_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (readyToExport) {
                                return readyToExport.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_terminate_success"));
                            response = true;
                        }
                        return response;
                    });*/
            },
            /**
             * @description open popup for ready to export options
             * @param readyToExport
             * @param $event
             */
            readyToExportOptions: function (workItem, $event) {
                var exportOptions = rootEntity.getGlobalSettings().hasExportOptions();
                // if (!exportOptions) {
                //     return self.exportReadyToExport(workItem, new ReadyToExportOption());
                // }

                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('ready-to-export-option'),
                        controller: 'readyToExportOptionPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            readyToExport: workItem
                        },
                        resolve: {
                            sites: function (correspondenceService) {
                                'ngInject';
                                return correspondenceService
                                    .loadCorrespondenceSites(workItem);
                            }
                        }
                    });
            }
        };


        /**
         * @description Star Ready To Export item
         * @param readyToExport
         */
        self.starReadyToExport = function (readyToExport) {
            var wob = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(readyToExport.generalStepElm.workObjectNumber) : JSON.parse(readyToExport.generalStepElm))
                : (readyToExport.hasOwnProperty('workObjectNumber') ? new Array(readyToExport.workObjectNumber) : JSON.parse(readyToExport));
            return $http
                .put(urlService.readyToExports + '/star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description Un Star Ready To Export item
         * @param readyToExport
         */
        self.unStarReadyToExport = function (readyToExport) {
            var wob = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(readyToExport.generalStepElm.workObjectNumber) : new Array(readyToExport.generalStepElm))
                : (readyToExport.hasOwnProperty('workObjectNumber') ? new Array(readyToExport.workObjectNumber) : new Array(readyToExport));
            return $http
                .put(urlService.readyToExports + '/un-star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description Star bulk Ready To Export item
         * @param readyToExportBulk
         */
        self.starBulkReadyToExport = function (readyToExportBulk) {
            var bulkWob = readyToExportBulk[0].hasOwnProperty('generalStepElm')
                ? (readyToExportBulk[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(readyToExportBulk, 'generalStepElm.workObjectNumber') : readyToExportBulk)
                : (readyToExportBulk[0].hasOwnProperty('workObjectNumber') ? _.map(readyToExportBulk, 'workObjectNumber') : readyToExportBulk);
            return $http
                .put(urlService.readyToExports + '/star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReadyToExport = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReadyToExport.push(key);
                    });
                    return _.filter(bulkWob, function (readyToExport) {
                        return (failedReadyToExport.indexOf(readyToExport) > -1);
                    });
                });
        };

        /**
         * @description Un-star bulk Ready To Export
         * @param readyToExportBulk
         */
        self.unStarBulkReadyToExport = function (readyToExportBulk) {
            var bulkWob = readyToExportBulk[0].hasOwnProperty('generalStepElm')
                ? (readyToExportBulk[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(readyToExportBulk, 'generalStepElm.workObjectNumber') : readyToExportBulk)
                : (readyToExportBulk[0].hasOwnProperty('workObjectNumber') ? _.map(readyToExportBulk, 'workObjectNumber') : readyToExportBulk);
            return $http
                .put(urlService.readyToExports + '/un-star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReadyToExport = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReadyToExport.push(key);
                    });
                    return _.filter(bulkWob, function (readyToExport) {
                        return (failedReadyToExport.indexOf(readyToExport) > -1);
                    });
                });
        };

        /**
         * @description Terminate Ready To Export item
         * @param readyToExport
         * @param reason
         */
        self.terminateReadyToExport = function (readyToExport, reason) {
            var info = readyToExport.getInfo();
            return $http
                .put(urlService.departmentInboxActions + "/" + info.documentClass + "/terminate/wob-num", {
                    first: info.wobNumber,
                    second: reason
                })
                .then(function (result) {
                    return readyToExport;
                });
        };

        /**
         * @description Export ready to export item
         * @param readyToExport
         * @param exportOptions
         */
        self.exportReadyToExport = function (readyToExport, exportOptions) {
            var info = readyToExport.getInfo();
            /*var vsId = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('vsId') ? readyToExport.generalStepElm.vsId : readyToExport.generalStepElm)
                : (readyToExport.hasOwnProperty('vsId') ? readyToExport.vsId : readyToExport);

            var wobNumber = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('workObjectNumber') ? readyToExport.generalStepElm.workObjectNumber : readyToExport.generalStepElm)
                : (readyToExport.hasOwnProperty('workObjectNumber') ? readyToExport.workObjectNumber : readyToExport);
*/

            return $http
                .put((urlService.exportReadyToExports).replace('{{vsId}}', info.vsId).replace('{{wobNum}}', info.wobNumber), exportOptions)
                .then(function () {
                    return readyToExport;
                });
        };

        /**
         * @description Terminate bulk Ready To Export items
         * @param workItems
         */
        self.terminateBulkReadyToExport = function (workItems) {
            /*var bulkReadyToExport = readyToExportBulk[0].hasOwnProperty('generalStepElm')
                ? (readyToExportBulk[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(readyToExportBulk, 'generalStepElm.workObjectNumber') : readyToExportBulk)
                : (readyToExportBulk[0].hasOwnProperty('workObjectNumber') ? _.map(readyToExportBulk, 'workObjectNumber') : readyToExportBulk);

            return $http
                .put((urlService.terminateReadyToExports + "/bulk"), bulkReadyToExport)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReadyToExport = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReadyToExport.push(key);
                    });
                    return _.filter(readyToExportBulk, function (readyToExport) {
                        return (failedReadyToExport.indexOf(readyToExport.workObjectNumber) > -1);
                    });
                });*/
            var items = _.map(workItems, function (workItem) {
                return {
                    first: workItem.getWobNumber(),
                    second: workItem.reason
                };
            });

            var wfName = "outgoing";

            return $http
                .put((urlService.departmentInboxActions + "/" + wfName.toLowerCase() + "/terminate/bulk"), items)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReadyToExports = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReadyToExports.push(key);
                    });
                    return _.filter(workItems, function (readyToExport) {
                        return (failedReadyToExports.indexOf(readyToExport.generalStepElm.workObjectNumber) > -1);
                    });
                });
        };


        /**
         * @description Add new ready To Export
         * @param readyToExport
         * @return {Promise|WorkItem}
         */
        self.addReadyToExport = function (readyToExport) {
            return $http
                .post(urlService.readyToExports,
                    generator.interceptSendInstance('WorkItem', readyToExport))
                .then(function (result) {
                    return generator.interceptReceivedInstance('WorkItem', generator.generateInstance(result.data.rs, WorkItem, self._sharedMethods));
                });
        };

        /**
         * @description Update the given ready To Export.
         * @param readyToExport
         * @return {Promise|WorkItem}
         */
        self.updateReadyToExport = function (readyToExport) {
            return $http
                .put(urlService.readyToExports,
                    generator.interceptSendInstance('WorkItem', readyToExport))
                .then(function () {
                    return generator.interceptReceivedInstance('WorkItem', generator.generateInstance(readyToExport, WorkItem, self._sharedMethods));
                });
        };

        /**
         * @description Delete given ready To Export.
         * @param readyToExport
         * @return {Promise|null}
         */
        self.deleteReadyToExport = function (readyToExport) {
            var id = readyToExport.hasOwnProperty('id') ? readyToExport.id : readyToExport;
            return $http.delete((urlService.readyToExports + '/' + id));
        };

        /**
         * @description Delete bulk ready To Export.
         * @param readyToExports
         * @return {Promise|null}
         */
        self.deleteBulkReadyToExports = function (readyToExports) {
            var bulkIds = readyToExports[0].hasOwnProperty('id') ? _.map(readyToExports, 'id') : readyToExports;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.readyToExports + '/' + 'bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedReadyToExports = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedReadyToExports.push(key);
                });
                return _.filter(readyToExports, function (readyToExport) {
                    return (failedReadyToExports.indexOf(readyToExport.id) > -1);
                });
            });
        };

        /**
         * @description Get ready To Export by readyToExportId
         * @param readyToExportId
         * @returns {WorkItem|undefined} return WorkItem Model or undefined if not found.
         */
        self.getReadyToExportById = function (readyToExportId) {
            readyToExportId = readyToExportId instanceof WorkItem ? readyToExportId.id : readyToExportId;
            return _.find(self.readyToExports, function (readyToExport) {
                return Number(readyToExport.id) === Number(readyToExportId)
            });
        };

        /**
         * @description Activate ready To Export
         * @param readyToExport
         */
        self.activateReadyToExport = function (readyToExport) {
            return $http
                .put((urlService.readyToExports + '/activate/' + readyToExport.id))
                .then(function () {
                    return readyToExport;
                });
        };

        /**
         * @description Deactivate ready To Export
         * @param readyToExport
         */
        self.deactivateReadyToExport = function (readyToExport) {
            return $http
                .put((urlService.readyToExports + '/deactivate/' + readyToExport.id))
                .then(function () {
                    return readyToExport;
                });
        };

        /**
         * @description Activate bulk of ready To Exports
         * @param readyToExports
         */
        self.activateBulkReadyToExports = function (readyToExports) {
            var bulkIds = readyToExports[0].hasOwnProperty('id') ? _.map(readyToExports, 'id') : readyToExports;
            return $http
                .put((urlService.readyToExports + '/activate/bulk'), bulkIds)
                .then(function () {
                    return readyToExports;
                });
        };

        /**
         * @description Deactivate bulk of ready To Exports
         * @param readyToExports
         */
        self.deactivateBulkReadyToExports = function (readyToExports) {
            var bulkIds = readyToExports[0].hasOwnProperty('id') ? _.map(readyToExports, 'id') : readyToExports;
            return $http
                .put((urlService.readyToExports + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return readyToExports;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param readyToExport
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReadyToExport = function (readyToExport, editMode) {
            var readyToExportsToFilter = self.readyToExports;
            if (editMode) {
                readyToExportsToFilter = _.filter(readyToExportsToFilter, function (readyToExportToFilter) {
                    return readyToExportToFilter.id !== readyToExport.id;
                });
            }
            return _.some(_.map(readyToExportsToFilter, function (existingReadyToExport) {
                return existingReadyToExport.arName === readyToExport.arName
                    || existingReadyToExport.enName.toLowerCase() === readyToExport.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReadyToExport, self.updateReadyToExport);
    });
};
