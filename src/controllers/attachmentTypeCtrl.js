module.exports = function (app) {
    app.controller('attachmentTypeCtrl', function (lookupService,
                                                   attachmentTypeService,
                                                   attachmentTypes,
                                                   $q,
                                                   $filter,
                                                   langService,
                                                   toast,
                                                   contextHelpService,
                                                   dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'attachmentTypeCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('attachment-types');

        /**
         * @description All attachment types
         * @type {*}
         */
        self.attachmentTypes = attachmentTypes;

        /**
         * @description Contains the selected attachment types
         * @type {Array}
         */
        self.selectedAttachmentTypes = [];

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.attachmentTypes.length + 21);
                    }
                }
            ]
        };

        self.statusServices = {
            'activate': attachmentTypeService.activateBulkAttachmentTypes,
            'deactivate': attachmentTypeService.deactivateBulkAttachmentTypes,
            'true': attachmentTypeService.activateAttachmentType,
            'false': attachmentTypeService.deactivateAttachmentType
        };

        /**
         * @description Opens dialog for add new attachment type
         * @param $event
         */
        self.openAddAttachmentTypeDialog = function ($event) {
            attachmentTypeService
                .controllerMethod
                .attachmentTypeAdd($event)
                .then(function (result) {
                    self.reloadAttachmentTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
        };

        /**
         * @description Opens dialog for edit attachment type
         * @param attachmentType
         * @param $event
         */
        self.openEditAttachmentTypeDialog = function (attachmentType, $event) {
            attachmentTypeService
                .controllerMethod
                .attachmentTypeEdit(attachmentType, $event)
                .then(function (result) {
                    self.reloadAttachmentTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.attachmentTypes = $filter('orderBy')(self.attachmentTypes, self.grid.order);
        };

        /**
         * @description this method to reload the grid
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadAttachmentTypes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return attachmentTypeService
                .loadAttachmentTypes()
                .then(function (result) {
                    self.attachmentTypes = result;
                    self.selectedAttachmentTypes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single attachment type
         * @param attachmentType
         * @param $event
         */
        self.removeAttachmentType = function (attachmentType, $event) {
            attachmentTypeService
                .controllerMethod
                .attachmentTypeDelete(attachmentType, $event)
                .then(function () {
                    self.reloadAttachmentTypes(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected attachment types
         * @param $event
         */
        self.removeBulkAttachmentTypes = function ($event) {
            attachmentTypeService
                .controllerMethod
                .attachmentTypeDeleteBulk(self.selectedAttachmentTypes, $event)
                .then(function () {
                    self.reloadAttachmentTypes(self.grid.page);
                });
        };

        /**
         * @description Change the status of attachment type
         * @param attachmentType
         */
        self.changeStatusAttachmentType = function (attachmentType) {
            self.statusServices[attachmentType.status](attachmentType)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    attachmentType.status = !attachmentType.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected attachment types
         * @param status
         */
        self.changeStatusBulkAttachmentTypes = function (status) {
            self.statusServices[status](self.selectedAttachmentTypes)
                .then(function () {
                    self.reloadAttachmentTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };
    });
};