module.exports = function (app) {
    app.controller('searchViewersLogCtrl', function (lookupService,
                                                     langService,
                                                     ResolveDefer,
                                                     $q,
                                                     _,
                                                     $filter,
                                                     generator,
                                                     $state,
                                                     rootEntity,
                                                     managerService,
                                                     contextHelpService,
                                                     toast,
                                                     employeeService,
                                                     dialog,
                                                     gridService,
                                                     cmsTemplate,
                                                     counterService,
                                                     correspondenceService,
                                                     documentSecurityService) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchViewersLogCtrl';
        contextHelpService.setHelpTo('search-viewers-log');

        self.watermarkSearchText = '';
        self.allSearchableRecords = [];
        self.viewerLogs = [];
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.viewerLogs.length + 21);
                    }
                }
            ]
        };
        self.selectedLogs = [];
        self.selectedDocument = null;


        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.viewerLogs = $filter('orderBy')(self.viewerLogs, self.grid.order);
        };

        /**
         * @description Opens the dialog to search documents to get logs
         * @param $event
         */
        self.showSearchDocumentDialog = function ($event) {
            documentSecurityService.openSearchDocumentDialog(self.allSearchableRecords, self.viewCorrespondence, $event)
                .then(function (correspondences) {
                    self.allSearchableRecords = correspondences;
                    self.selectedDocument = null;
                    self.viewerLogs = [];
                });
        };

        /**
         * @description Get the logs of entered barcode or selected correspondences
         * @param $event
         */
        self.searchDocumentByWatermark = function ($event) {
            documentSecurityService.loadDocumentsForViewerLogs(self.watermarkSearchText)
                .then(function (correspondences) {
                    self.allSearchableRecords = correspondences;
                    self.selectedDocument = null;
                    self.viewerLogs = [];
                });
        };

        /**
         * @description Removes the correspondence from list
         * @param correspondence
         */
        self.removeCorrespondence = function (correspondence) {
            dialog.confirmMessage(langService.get('confirm_remove').change({name: correspondence.getTranslatedName()}))
                .then(function () {
                    self.allSearchableRecords = _.filter(self.allSearchableRecords, function (record) {
                        return record.getInfo().vsId !== correspondence.getInfo().vsId;
                    });
                    if (self.selectedDocument.getInfo().vsId === correspondence.getInfo().vsId) {
                        self.selectedDocument = null;
                        self.viewerLogs = [];
                    }
                })
        };

        /**
         * @description Opens the correspondence to view
         * @param correspondence
         * @param $event
         * @param forceStopPropagation
         */
        self.viewCorrespondence = function (correspondence, $event, forceStopPropagation) {
            if ($event && forceStopPropagation) {
                $event.stopPropagation();
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(correspondence, [], true, true);
        };

        /**
         * @description Shows the viewer log for particular document
         * @param record
         * @param $event
         * @param forceStopPropagation
         */
        self.showViewerLog = function (record, $event, forceStopPropagation) {
            if ($event && forceStopPropagation) {
                $event.stopPropagation();
            }
            self.selectedDocument = record;
            documentSecurityService.loadViewerLogsByVsId(record, $event)
                .then(function (result) {
                    self.viewerLogs = result;
                });
        };

        /**
         * @description Export Viewer Log To Excel
         * @param $event
         */
        self.exportViewerLogToExcel = function ($event) {
            var heading = langService.get('menu_item_search_viewers_log') + ' - ' + self.selectedDocument.getTranslatedName();
            documentSecurityService.exportViewerLogToExcel(heading, self.viewerLogs);
        };

        /**
         * @description Export Viewer Log To Excel
         */
        self.exportViewerLogToPDF = function ($event) {
            var heading = langService.get('menu_item_search_viewers_log') + ' - ' + self.selectedDocument.getTranslatedName();
            documentSecurityService.exportViewerLogToPDF(heading, self.viewerLogs);
        };
    });
};

