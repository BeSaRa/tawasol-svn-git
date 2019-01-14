module.exports = function (app) {
    app.controller('linkedDocsAttachmentPopCtrl', function (dialog, exportOptions, _, langService, model, linkedDocs) {
        'ngInject';
        var self = this;
        self.controllerName = 'linkedDocsAttachmentPopCtrl';

        self.exportOptions = angular.copy(exportOptions);

        self.model = model;

        self.linkedDocs = linkedDocs;

        self.searchModel = '';

        self.selectedCorrespondences = [];


        function _selectCorrespondences() {
            var ids = _.map(self.exportOptions.ATTACHMENT_LINKED_DOCS, function (item) {
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
            filter: {search: {}}
        };

        self.sendSelectedLinkedDocuments = function () {
            dialog.hide(self.selectedCorrespondences);
        };

        self.closeDialog = function () {
            dialog.cancel(self.exportOptions.ATTACHMENT_LINKED_DOCS);
        }


    });
};
