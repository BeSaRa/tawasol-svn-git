module.exports = function (app) {
    app.controller('manageLinkedDocumentDirectiveCtrl', function (LangWatcher,
                                                                  _,
                                                                  viewDocumentService,
                                                                  correspondenceService,
                                                                  cmsTemplate,
                                                                  rootEntity,
                                                                  dialog,
                                                                  langService,
                                                                  $scope,
                                                                  $timeout,
                                                                  employeeService,
                                                                  $stateParams,
                                                                  toast,
                                                                  gridService,
                                                                  Outgoing,
                                                                  Incoming,
                                                                  Internal,
                                                                  General,
                                                                  G2G,
                                                                  G2GMessagingHistory) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageLinkedDocumentDirectiveCtrl';
        LangWatcher($scope);
        // current linked documents
        self.linkedDocs = [];
        // selected Correspondences
        self.selectedCorrespondences = [];
        // get global settings
        self.globalSetting = rootEntity.getGlobalSettings();

        self.vsId = null;

        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return self.globalSetting.searchAmountLimit
                     }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.linkedDocs.length + 21);
                    }
                }
            ],
            filter: {search: {}},
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.others.linkedDoc),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.others.linkedDoc, self.grid.truncateSubject);
            }
        };

        function _filterExists(correspondences, vsIds) {
            return _.filter(correspondences, function (correspondence) {
                return vsIds.indexOf(correspondence.vsId) === -1;
            });
        }

        /**
         * the registered models for our CMS
         * @type {{outgoing: (Outgoing|*), internal: (Internal|*), incoming: (Incoming|*)}}
         */
        self.models = {
            outgoing: Outgoing,
            internal: Internal,
            incoming: Incoming,
            general: General,
            g2g: G2G,
            g2gmessaginghistory: G2GMessagingHistory
        };

        /**
         * @description view correspondence .
         * @param correspondence
         * @param $event
         */
        self.viewCorrespondence = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(correspondence, [], true, true);
        };

        var _saveLinkedDocs = function(linkedDocs){
            var document = new self.models[self.documentClass.toLowerCase()]({
                linkedDocs: angular.copy(linkedDocs),
                vsId: self.vsId,
                docClassName: self.documentClass
            });

            document
                .saveLinkedDocuments()
                .then(function () {
                    self.linkedDocs = linkedDocs;
                    toast.success(langService.get('success_messages'));
                })
                .catch(function () {
                    toast.success(langService.get('error_messages'));
                });
        };

        /**
         * @description open search dialog
         * @param $event
         */
        self.openSearchDialog = function ($event) {
            dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('search-linked-document'),
                    controller: 'searchLinkedDocumentPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        linkedDocs: self.linkedDocs,
                        viewCallback: self.viewCorrespondence,
                        excludeVsId: self.vsId,
                        isAdminSearch: false,
                        multiSelect: true
                    },
                    resolve: {
                        organizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getAllOrganizationsStructure()
                                .then(function (organizations) {
                                    return _.filter(organizations, function (organization) {
                                        return organization.hasRegistry;
                                    })
                                });
                        }
                    }
                })
                .then(function (correspondences) {
                    var vsIds = _.map(self.linkedDocs, 'vsId'); // get current linked documents vsIds
                    var linkedDocs = angular.isArray(self.linkedDocs) ? self.linkedDocs.concat(_filterExists(correspondences, vsIds)) : correspondences;

                    if (!self.vsId) {
                        self.linkedDocs = linkedDocs;
                    } else {
                        _saveLinkedDocs(angular.copy(linkedDocs));
                    }
                });
        };

        /**
         * @description delete correspondence from the grid.
         * @param linkedDocument
         */
        self.deleteLinkedDocument = function (linkedDocument) {
            dialog.confirmMessage(langService.get('confirm_delete').change({name: linkedDocument.getTranslatedName()}))
                .then(function () {
                    var vsId = linkedDocument.getInfo().vsId;
                    self.linkedDocs = _.filter(self.linkedDocs, function (correspondence) {
                        return vsId !== correspondence.getInfo().vsId;
                    });
                    _saveLinkedDocs(angular.copy(self.linkedDocs));
                });
        };

        /**
         * @description delete bulk of linked documents
         */
        self.deleteBulkLinkedDocument = function ($event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    var vsIds = _.map(self.selectedCorrespondences, 'vsId');
                    self.linkedDocs = _.filter(self.linkedDocs, function (linkedDocs) {
                        return vsIds.indexOf(linkedDocs.vsId) === -1;
                    });
                    _saveLinkedDocs(angular.copy(self.linkedDocs));
                    self.selectedCorrespondences = [];
                    //toast.success(langService.get('delete_success'));
                })
        };

        /**
         * @description disable delete for first linked docs when action reply
         * @returns {boolean}
         */
        self.checkIfReplyToAction = function (correspondence) {
            return !(self.linkedDocs[0].vsId === correspondence.vsId && $stateParams.hasOwnProperty('action') && $stateParams.action === 'reply');
        }
    });
};
