module.exports = function (app) {
    app.service('correspondenceSiteService', function (urlService,
                                                       toast,
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
         * @description Delete bulk organization types.
         * @param correspondenceSites
         * @return {Promise|null}
         */
        self.deleteBulkCorrespondenceSites = function (correspondenceSites) {
            var bulkIds = correspondenceSites[0].hasOwnProperty('id') ? _.map(correspondenceSites, 'id') : correspondenceSites;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.correspondenceSites + '/bulk',
                data: bulkIds
            }).then(function (result) {
                /*result = result.data.rs;
                var failedCorrespondenceSites = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedCorrespondenceSites.push(Number(key));
                });
                return _.filter(correspondenceSites, function (correspondenceSite) {
                    return (failedCorrespondenceSites.indexOf(correspondenceSite.id) > -1);
                });*/
                return generator.getBulkActionResponse(result, correspondenceSites, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following');
            });
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteCorrespondenceSite, self.updateCorrespondenceSite);

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
         * @description get children for parent correspondenceSites
         * @param parents correspondenceSites to get they children
         * @param children correspondenceSites to search in
         * @return {Array}
         */
        self.getChildrenCorrespondenceSites = function (parents, children) {
            return _.map(parents, function (correspondenceSite) {
                correspondenceSite.children = [];
                if (children.hasOwnProperty(correspondenceSite.id)) {
                    correspondenceSite.setChildren(children[correspondenceSite.id]);
                }
                return correspondenceSite;
            });
        };
        /**
         * @description to make separation between parents and children records
         * @param correspondenceSites
         * @param parents
         * @param children
         * @return {*}
         */
        self.correspondenceSiteSeparator = function (correspondenceSites, parents, children) {
            _.map(correspondenceSites, function (correspondenceSite) {
                var parent = correspondenceSite.parent;
                if (!parent) {
                    parents.push(correspondenceSite);
                } else {
                    if (!children.hasOwnProperty(parent)) {
                        children[parent] = [];
                    }
                    children[parent].push(correspondenceSite);
                }
            });
            return self;
        };
        /**
         * @description to create the hierarchy for the parent and child for correspondenceSites
         * @param correspondenceSites
         * @return {Array| CorrespondenceSite} array of parents correspondenceSites
         */
        self.createCorrespondenceSiteHierarchy = function (correspondenceSites) {
            var parents = [], children = {};
            return self
                .correspondenceSiteSeparator(correspondenceSites, parents, children)
                .getChildrenCorrespondenceSites(parents, children);
        };
        /**
         * @description get parent correspondenceSites
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

        self.getMainCorrespondenceSites = function (correspondenceSites) {
            return _.filter(correspondenceSites, function (correspondenceSite) {
                return !correspondenceSite.parent;
            })
        };

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
         * @description Contains methods for CRUD operations for correspondenceSites
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new correspondenceSite
             * @param parentCorrespondenceSite
             * @param sub
             * @param $event
             */
            correspondenceSiteAdd: function (parentCorrespondenceSite, sub, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('correspondence-site'),
                        controller: 'correspondenceSitePopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: false,
                            correspondenceSite: new CorrespondenceSite(),
                            //correspondenceSites: self.correspondenceSites,
                            parent: parentCorrespondenceSite,
                            sub: sub
                        },
                        resolve: {
                            correspondenceSites: function(){
                                'ngInject';
                                return self.loadCorrespondenceSites();
                            }
                        }
                    });
            },
            /**
             * @description Opens popup to edit correspondenceSite
             * @param correspondenceSite
             * @param $event
             */
            correspondenceSiteEdit: function (correspondenceSite, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('correspondence-site'),
                        controller: 'correspondenceSitePopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: true,
                            correspondenceSite: correspondenceSite,
                            correspondenceSites: self.correspondenceSites,
                            parent: correspondenceSite.parent,
                            sub: false
                        }
                    });
            },
            subCorrespondenceSiteEdit: function (correspondenceSite , parent, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('correspondence-site'),
                        controller: 'correspondenceSitePopCtrl',
                        controllerAs: 'ctrl',
                        escapeToClose: false,
                        locals: {
                            editMode: true,
                            correspondenceSite: correspondenceSite,
                            correspondenceSites: self.correspondenceSites,
                            parent: parent,
                            sub: true
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
                            });
                    });
            },
            /**
             * @description Show confirm box and delete bulk correspondenceSites
             * @param correspondenceSites
             * @param $event
             */
            correspondenceSiteDeleteBulk: function (correspondenceSites, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkCorrespondenceSites(correspondenceSites);
                            /*.then(function (result) {
                                var response = false;
                                if (result.length === correspondenceSites.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (correspondenceSite) {
                                        return correspondenceSite.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });*/
                    });
            },
            /**
             * @description view sub CorrespondenceSites
             * @param correspondenceSite
             * @param $event
             * @return {promise}
             */
            viewSubCorrespondenceSites: function (correspondenceSite, $event) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('sub-correspondence-site'),
                        controller: 'subCorrespondenceSiteViewPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            correspondenceSite: correspondenceSite,
                            correspondenceSites: self.getMainCorrespondenceSites(self.correspondenceSites)
                        }
                    });
            },
            showCorrespondenceSiteSelector: function (excluded) {
                return dialog.showDialog({
                    template: cmsTemplate.getPopup('correspondence-sites-selector'),
                    controller: 'correspondenceSiteSelectorPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        excluded: excluded
                    }
                });
            }
        };
    });
};