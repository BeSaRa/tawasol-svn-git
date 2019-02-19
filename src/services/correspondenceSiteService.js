module.exports = function (app) {
    app.service('correspondenceSiteService', function (urlService,
                                                          toast,
                                                          errorCode,
                                                          cmsTemplate,
                                                          langService,
                                                          dialog,
                                                          $http,
                                                          $q,
                                                          generator,
                                                          CorrespondenceSite,
                                                          SearchCorrespondenceSite,
                                                          _) {
        'ngInject';
        var self = this;
        self.serviceName = 'correspondenceSiteService';

        self.correspondenceSites = [];

        /**
         * @description load correspondenceSites from server.
         * @returns {Promise|correspondenceSites}
         */
        self.loadCorrespondenceSites = function () {
            return $http.get(urlService.correspondenceSites).then(function (result) {
                self.correspondenceSites = generator.generateCollection(result.data.rs, CorrespondenceSite, self._sharedMethods);
                self.correspondenceSites = generator.interceptReceivedCollection('CorrespondenceSite', self.correspondenceSites);
                return self.correspondenceSites;
            });
        };
        /**
         * @description get correspondenceSites from self.correspondenceSites if found and if not load it from server again.
         * @returns {Promise|correspondenceSites}
         */
        self.getCorrespondenceSites = function () {
            return self.correspondenceSites.length ? $q.when(self.correspondenceSites) : self.loadCorrespondenceSites();
        };

        /**
         * @description load active correspondenceSites from server.
         * @returns {Promise|activeCorrespondenceSites}
         */
        self.loadActiveCorrespondenceSites = function () {
            return $http.get(urlService.correspondenceSites + '/active').then(function (result) {
                self.activeCorrespondenceSites = generator.generateCollection(result.data.rs, CorrespondenceSite, self._sharedMethods);
                self.activeCorrespondenceSites = generator.interceptReceivedCollection('CorrespondenceSite', self.activeCorrespondenceSites);
                return self.activeCorrespondenceSites;
            });
        };
        /**
         * @description get active correspondenceSites from self.activeCorrespondenceSites if found and if not load it from server again.
         * @returns {Promise|activeCorrespondenceSites}
         */
        self.getActiveCorrespondenceSites = function () {
            return self.activeCorrespondenceSites.length ? $q.when(self.activeCorrespondenceSites) : self.loadActiveCorrespondenceSites();
        };

        /**
         * @description load classifications with limit up to 50
         * @param limit
         * @return {*}
         */
        self.loadCorrespondenceSitesWithLimit = function (limit) {
            return $http
                .get(urlService.entityWithlimit.replace('{entityName}', 'correspondence-site').replace('{number}', limit ? limit : 50))
                .then(function (result) {
                    self.correspondenceSites = generator.generateCollection(result.data.rs, CorrespondenceSite, self._sharedMethods);
                    self.correspondenceSites = generator.interceptReceivedCollection('CorrespondenceSite', self.correspondenceSites);
                    return self.correspondenceSites;
                });
        };
        /**
         * @description load sub correspondence sites for the given correspondence site.
         * @param correspondenceSite
         * @return {*}
         */

        self.loadSubCorrespondenceSites = function (correspondenceSite) {
            var id = correspondenceSite.hasOwnProperty('id') ? correspondenceSite.id : correspondenceSite;
            return $http
                .get(urlService.childrenEntities.replace('{entityName}', 'correspondence-site').replace('{entityId}', id))
                .then(function (result) {
                    return generator.interceptReceivedCollection('CorrespondenceSite', generator.generateCollection(result.data.rs, CorrespondenceSite, self._sharedMethods));
                });
        };
        /**
         * @description get correspondenceSite by correspondenceSiteId
         * @param correspondenceSiteId
         * @returns {CorrespondenceSite|undefined} return CorrespondenceSite Model or undefined if not found.
         */
        self.getCorrespondenceSiteById = function (correspondenceSiteId) {
            correspondenceSiteId = correspondenceSiteId instanceof CorrespondenceSite ? correspondenceSiteId.id : correspondenceSiteId;
            return _.find(self.correspondenceSites, function (correspondenceSite) {
                return Number(correspondenceSite.id) === Number(correspondenceSiteId)
            });
        };

        /**
         * @description Filters parent correspondenceSites
         * @param excludeCorrespondenceSite
         * @return {Array}
         */
        self.getParentCorrespondenceSites = function (excludeCorrespondenceSite) {
            return _.filter(self.correspondenceSites, function (correspondenceSite) {
                if (excludeCorrespondenceSite)
                    return !correspondenceSite.parent && excludeCorrespondenceSite.id !== correspondenceSite.id;
                else
                    return !correspondenceSite.parent;
            });
        };

        /**
         * @description Filters the main correspondence sites from given correspondence sites
         * @param correspondenceSites
         * @returns {Array}
         */
        self.getMainCorrespondenceSites = function (correspondenceSites) {
            return _.filter(correspondenceSites, function (correspondenceSite) {
                return !correspondenceSite.parent;
            })
        };

        /**
         * @description Contains methods for CRUD operations for correspondenceSites
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new correspondenceSite
             * @param parentCorrespondenceSite
             * @param defaultOU
             * @param $event
             */
            correspondenceSiteAdd: function (parentCorrespondenceSite, defaultOU, $event) {
                var correspondenceSite = new CorrespondenceSite({
                    parent: parentCorrespondenceSite,
                    correspondenceTypeId: parentCorrespondenceSite ? parentCorrespondenceSite.correspondenceTypeId : null,
                    isGlobal: (!!defaultOU) ? false : (parentCorrespondenceSite ? parentCorrespondenceSite.isGlobal : true),
                    relatedOus: defaultOU ? [defaultOU] : []
                });
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('correspondence-site'),
                        controller: 'correspondenceSitePopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: false,
                            correspondenceSite: correspondenceSite,
                            defaultOU: defaultOU
                        }
                    });
            },
            /**
             * @description Opens popup to edit correspondenceSite
             * @param correspondenceSite
             * @param defaultOU
             * @param $event
             */
            correspondenceSiteEdit: function (correspondenceSite, defaultOU, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('correspondence-site'),
                        controller: 'correspondenceSitePopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: true,
                            correspondenceSite: (defaultOU ? generator.interceptReceivedInstance('CorrespondenceSite', correspondenceSite.correspondenceSite) : correspondenceSite),
                            defaultOU: defaultOU
                        }
                    });
            },
            /**
             * @description Show confirm box and delete correspondenceSite
             * @param correspondenceSite
             * @param $event
             */
            correspondenceSiteDelete: function (correspondenceSite, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: correspondenceSite.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteCorrespondenceSite(correspondenceSite)
                            .then(function () {
                                toast.success(langService.get('delete_specific_success').change({name: correspondenceSite.getNames()}));
                                return true;
                            })
                            .catch(function (error) {
                                return errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                                    dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                                        lookup: langService.get('correspondence_site'),
                                        used: langService.get('document')
                                    }), null, null, $event);
                                    return $q.reject('CAN_NOT_DELETE_LOOKUP');
                                })
                            });
                    });
            },
            /**
             * @description view sub CorrespondenceSites
             * @param mainCorrespondenceSite
             * @param $event
             * @return {promise}
             */
            viewSubCorrespondenceSites: function (mainCorrespondenceSite, $event) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('sub-correspondence-site'),
                        controller: 'subCorrespondenceSiteViewPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            mainCorrespondenceSite: mainCorrespondenceSite
                        },
                        resolve: {
                            subCorrespondenceSites: function () {
                                'ngInject';
                                return self.loadSubCorrespondenceSites(mainCorrespondenceSite);
                            }
                        }
                    });
            },
            /**
             * @description Opens popup for adding correspondence sites to OU from organization popup
             * @param excluded
             * @returns {promise}
             */
            showCorrespondenceSiteSelector: function (excluded) {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('correspondence-sites-selector'),
                    controller: 'correspondenceSiteSelectorPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        excluded: excluded
                    },
                    resolve: {
                        correspondenceSites: function () {
                            'ngInject';
                            return self.loadCorrespondenceSitesWithLimit(100);
                        }
                    }
                });
            }
        };

        /**
         * @description add new correspondenceSite to service
         * @param correspondenceSite
         * @return {Promise|CorrespondenceSite}
         */
        self.addCorrespondenceSite = function (correspondenceSite) {
            return $http
                .post(urlService.correspondenceSites,
                    generator.interceptSendInstance('CorrespondenceSite', correspondenceSite))
                .then(function (result) {
                    correspondenceSite.id = result.data.rs;
                    return generator.generateInstance(correspondenceSite, CorrespondenceSite, self._sharedMethods);
                });
        };
        /**
         * @description make an update for given correspondenceSite.
         * @param correspondenceSite
         * @return {Promise|CorrespondenceSite}
         */
        self.updateCorrespondenceSite = function (correspondenceSite) {
            return $http
                .put(urlService.correspondenceSites,
                    generator.interceptSendInstance('CorrespondenceSite', correspondenceSite))
                .then(function () {
                    return generator.generateInstance(correspondenceSite, CorrespondenceSite, self._sharedMethods);
                });
        };
        /**
         * @description delete given correspondenceSite.
         * @param correspondenceSite
         * @return {Promise}
         */
        self.deleteCorrespondenceSite = function (correspondenceSite) {
            var id = correspondenceSite.hasOwnProperty('id') ? correspondenceSite.id : correspondenceSite;
            return $http
                .delete((urlService.correspondenceSites + '/' + id));
        };

        /**
         * @description Activate correspondenceSite
         * @param correspondenceSite
         */
        self.activateCorrespondenceSite = function (correspondenceSite) {
            return $http
                .put((urlService.correspondenceSites + '/activate/' + correspondenceSite.id))
                .then(function () {
                    return correspondenceSite;
                });
        };

        /**
         * @description Deactivate correspondenceSite
         * @param correspondenceSite
         */
        self.deactivateCorrespondenceSite = function (correspondenceSite) {
            return $http
                .put((urlService.correspondenceSites + '/deactivate/' + correspondenceSite.id))
                .then(function () {
                    return correspondenceSite;
                });
        };

        /**
         * @description Activate bulk correspondenceSites
         * @param correspondenceSites
         */
        self.activateBulkCorrespondenceSites = function (correspondenceSites) {
            var bulkIds = correspondenceSites[0].hasOwnProperty('id') ? _.map(correspondenceSites, 'id') : correspondenceSites;
            return $http
                .put((urlService.correspondenceSites + '/activate/bulk'), bulkIds)
                .then(function (result) {
                    //return correspondenceSites;
                    return generator.getBulkActionResponse(result, correspondenceSites, false, 'failed_activate_selected', 'success_activate_selected', 'success_activate_selected_except_following');
                });
        };

        /**
         * @description Deactivate bulk correspondenceSites
         * @param correspondenceSites
         */
        self.deactivateBulkCorrespondenceSites = function (correspondenceSites) {
            var bulkIds = correspondenceSites[0].hasOwnProperty('id') ? _.map(correspondenceSites, 'id') : correspondenceSites;
            return $http
                .put((urlService.correspondenceSites + '/deactivate/bulk'), bulkIds)
                .then(function (result) {
                    //return correspondenceSites;
                    return generator.getBulkActionResponse(result, correspondenceSites, false, 'failed_deactivate_selected', 'success_deactivate_selected', 'success_deactivate_selected_except_following');
                });
        };

        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteCorrespondenceSite, self.updateCorrespondenceSite);

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param correspondenceSite
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateCorrespondenceSite = function (correspondenceSite, editMode) {
            var correspondenceSitesToFilter = self.correspondenceSites;
            if (editMode) {
                correspondenceSitesToFilter = _.filter(correspondenceSitesToFilter, function (correspondenceSiteToFilter) {
                    return correspondenceSiteToFilter.id !== correspondenceSite.id;
                });
            }
            return _.some(_.map(correspondenceSitesToFilter, function (existingCorrespondenceSite) {
                return existingCorrespondenceSite.arName === correspondenceSite.arName
                    || existingCorrespondenceSite.enName.toLowerCase() === correspondenceSite.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Filters the sub correspondence sites for given main correspondence site
         * @param mainCorrespondenceSite
         * @returns {Array}
         */
        self.getSubCorrespondenceSites = function (mainCorrespondenceSite) {
            return _.filter(self.correspondenceSites, function (correspondenceSite) {
                mainCorrespondenceSite = mainCorrespondenceSite.hasOwnProperty('id') ? mainCorrespondenceSite.id : mainCorrespondenceSite;
                if (correspondenceSite.parent instanceof CorrespondenceSite)
                    return correspondenceSite.parent.id === mainCorrespondenceSite;
                else
                    return correspondenceSite.parent === mainCorrespondenceSite;
            });
        };

        self.searchMainCorrespondenceSites = [];
        self.searchSubCorrespondenceSites = [];

        /**
         * @description get all main sites with site type id from server
         * @param siteTypeId
         */
        self.getMainCorrespondenceSitesWithSiteTypeId = function (siteTypeId) {
            return $http.get(urlService.searchCorrespondenceSites + "/search/main?type=" + siteTypeId).then(function (result) {
                self.searchMainCorrespondenceSites = generator.generateCollection(result.data.rs, SearchCorrespondenceSite, self._sharedMethods);
                self.searchMainCorrespondenceSites = generator.interceptReceivedCollection('SearchCorrespondenceSite', self.searchMainCorrespondenceSites);
                return self.searchMainCorrespondenceSites;
            }).catch(function () {
                return [];
            });
        };
        /**
         * @description get all sub sites with site type id and main site id from server
         * @param mainSiteId
         */
        self.getSubCorrespondenceSitesWithSiteTypeId = function (mainSiteId) {
            return $http.get(urlService.searchCorrespondenceSites + "/main-site-id/" + mainSiteId).then(function (result) {
                self.searchSubCorrespondenceSites = generator.generateCollection(result.data.rs, SearchCorrespondenceSite, self._sharedMethods);
                self.searchSubCorrespondenceSites = generator.interceptReceivedCollection('SearchCorrespondenceSite', self.searchSubCorrespondenceSites);
                return self.searchSubCorrespondenceSites;
            }).catch(function () {
                return [];
            });
        };

        /**
         * @description search in classifications .
         * @param searchText
         * @param parent
         * @return {*}
         */
        self.correspondenceSiteSearch = function (searchText, parent) {
            return $http.get(urlService.correspondenceSites + '/criteria', {
                params: {
                    criteria: searchText,
                    parent: typeof parent !== 'undefined' ? (parent.hasOwnProperty('id') ? parent.id : parent) : null
                }
            }).then(function (result) {
                return generator.interceptReceivedCollection('CorrespondenceSite', generator.generateCollection(result.data.rs, CorrespondenceSite, self._sharedMethods));
            });
        };
    });
};
