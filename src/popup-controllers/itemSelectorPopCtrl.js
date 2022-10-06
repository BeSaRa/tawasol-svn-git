module.exports = function (app) {
    app.controller('itemSelectorPopCtrl', function (_,
                                                    dialog,
                                                    langService,
                                                    attachmentService,
                                                    correspondenceService,
                                                    employeeService,
                                                    gridService,
                                                    generator,
                                                    $filter,
                                                    info,
                                                    title,
                                                    items,
                                                    selectedItems,
                                                    selectionCallback,
                                                    downloadService) {
        'ngInject';
        var self = this;
        self.controllerName = 'itemSelectorPopCtrl';

        self.title = title;
        self.items = items;
        self.selectedItems = [];
        self.selectionCallback = selectionCallback;
        self.isViewCorrespondence = true;

        self.grid = {
            progress: null,
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: 'docSubject', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return self.globalSetting.searchAmountLimit
                     }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.items.length + 21);
                    }
                }
            ],
            filter: {search: {}},
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.others.linkedDocSearch),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.others.linkedDocSearch, self.grid.truncateSubject);
            }
        };

        if (self.selectionCallback) {
            self.selectedItems = _.filter(self.items, function (item) {
                return self.selectionCallback(item, selectedItems);
            });
        }

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.items = $filter('orderBy')(self.items, self.grid.order);
        };

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
         * @description close popup
         */
        self.closeItemSelectorPopup = function () {
            dialog.cancel();
        };
        /**
         * @description send selected items from grid
         */
        self.sendSelectedItems = function () {
            dialog.hide(self.selectedItems);
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

        self.openViewDocumentAttachment = function (attachment, $event) {
            $event.preventDefault();
            attachmentService.viewAttachment(attachment, info.documentClass);
        };

        self.downloadAttachment = function (attachment, $event) {
            if (attachment.isViewable() && employeeService.hasPermissionTo("DOWNLOAD_ATTACHMENT_WITHOUT_WATERMARK")) {
                var buttonsList = [
                    {id: 1, type: "yes", text: "yes", value: true, cssClass: ""},
                    {id: 2, type: "no", text: "no", value: false, cssClass: ""}
                ];

                return dialog.confirmMessageWithDynamicButtonsList(langService.get('do_you_want_to_download_without_watermark'), buttonsList, '')
                    .then(function (selectedLabel) {
                        return _downloadAttachment(attachment, selectedLabel.value);
                    })
            } else {
                return _downloadAttachment(attachment);
            }
        };

        function _downloadAttachment(attachment, withoutWatermark) {
            downloadService.controllerMethod
                .attachmentDownload(attachment.vsId, info.docClassId, info.vsId, withoutWatermark);
        }

    });
};
