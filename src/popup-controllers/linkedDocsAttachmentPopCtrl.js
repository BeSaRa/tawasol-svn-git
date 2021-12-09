module.exports = function (app) {
    app.controller('linkedDocsAttachmentPopCtrl', function (dialog, exportOptions, _, langService, model, linkedDocs, gridService, generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'linkedDocsAttachmentPopCtrl';

        self.exportOptions = angular.copy(exportOptions);

        self.model = model;

        self.linkedDocs = linkedDocs;

        self.searchModel = '';

        self.selectedCorrespondences = [];

        function _getAttachmentLinkedDocs() {
            var docs;
            if (self.exportOptions.hasOwnProperty('exportItems')) {
                docs = self.exportOptions.exportItems;
            } else if (self.exportOptions.hasOwnProperty('exportOptions')) {
                docs = self.exportOptions.exportOptions;
            } else {
                docs = self.exportOptions;
            }
            return docs.ATTACHMENT_LINKED_DOCS;
        }

        function _selectCorrespondences() {
            var ids = _.map(_getAttachmentLinkedDocs(), function (item) {
                return item.getInfo().vsId;
            });

            _.map(self.linkedDocs, function (item, index) {
                if (ids.indexOf(self.linkedDocs[index].getInfo().vsId) !== -1) {
                    self.selectedCorrespondences.push(self.linkedDocs[index]);
                }
            })
        }

        _selectCorrespondences();

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
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.others.linkedDocAttachments),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.others.linkedDocAttachments, self.grid.truncateSubject);
            }
        };

        self.sendSelectedLinkedDocuments = function () {
            dialog.hide(self.selectedCorrespondences);
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

        self.closeDialog = function () {
            dialog.cancel(_getAttachmentLinkedDocs());
        }


    });
};
