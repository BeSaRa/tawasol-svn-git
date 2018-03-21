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
                                                                  employeeService) {
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
            filter: {search: {}}
        };

        function _filterExists(correspondences, vsIds) {
            return _.filter(correspondences, function (correspondence) {
                return vsIds.indexOf(correspondence.vsId) === -1;
            });
        }

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
            //correspondenceService.viewCorrespondence(correspondence, [], true, true);
            correspondenceService.viewLinkedDocument(correspondence);
        };
        /**
         * @description open search dialog
         * @param $event
         */
        self.openSearchDialog = function ($event) {
            dialog
                .showDialog({
                    template: cmsTemplate.getPopup('search-linked-document'),
                    controller: 'searchLinkedDocumentPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        linkedDocs: self.linkedDocs,
                        viewCallback: self.viewCorrespondence
                    }
                })
                .then(function (correspondences) {
                    var vsIds = _.map(self.linkedDocs, 'vsId'); // get current linked documents vsIds
                    self.linkedDocs = angular.isArray(self.linkedDocs) ? self.linkedDocs.concat(_filterExists(correspondences, vsIds)) : correspondences;
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
                });
        };
    });
};