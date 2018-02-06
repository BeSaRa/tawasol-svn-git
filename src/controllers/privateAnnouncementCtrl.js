module.exports = function (app) {
    app.controller('privateAnnouncementCtrl', function (lookupService,
                                                        privateAnnouncementService,
                                                        privateAnnouncements,
                                                        $q,
                                                        langService,
                                                        toast,
                                                        dialog,
                                                        moment,
                                                        publicAnnouncementService,
                                                        organizations,
                                                        contextHelpService,
                                                        employeeService,
                                                        organizationsHasRegistry) {
        'ngInject';
        var self = this;

        self.controllerName = 'privateAnnouncementCtrl';
        contextHelpService.setHelpTo('private-announcements');

        self.progress = null;
        self.organizations = organizations;
        self.organizationsHasRegistry = organizationsHasRegistry;

        /**
         * @description All private announcements
         * @type {*}
         */
        self.privateAnnouncements = privateAnnouncements;

        function _checkCurrentOu(model) {
            var ouId = employeeService.getEmployee().organization.ouid;
            return _.some(model.subscribers, function (item) {
                return item.ouId === ouId && !item.announcementType;
            });
        }

        /**
         * @description Contains the selected private announcements
         * @type {Array}
         */
        self.selectedPrivateAnnouncements = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return ( self.privateAnnouncements.length + 21); 
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for private announcements
         */
        self.statusServices = {
            'activate': privateAnnouncementService.activateBulkPrivateAnnouncements,
            'deactivate': privateAnnouncementService.deactivateBulkPrivateAnnouncements,
            'true': privateAnnouncementService.activatePrivateAnnouncement,
            'false': privateAnnouncementService.deactivatePrivateAnnouncement
        };

        /**
         * @description Opens dialog for add new private announcement
         * @param $event
         */
        self.openAddPrivateAnnouncementDialog = function ($event) {
            privateAnnouncementService
                .controllerMethod
                .privateAnnouncementAdd(self.organizations, self.organizationsHasRegistry, $event)
                .then(function () {
                    self.reloadPrivateAnnouncements(self.grid.page);
                })
        };

        /**
         * @description Opens dialog for edit private announcement
         * @param $event
         * @param privateAnnouncement
         */
        self.openEditPrivateAnnouncementDialog = function (privateAnnouncement, $event) {
            privateAnnouncementService
                .controllerMethod
                .privateAnnouncementEdit(privateAnnouncement, self.organizations, self.organizationsHasRegistry, $event)
                .then(function () {
                    self.reloadPrivateAnnouncements(self.grid.page);
                });
        };

        /**
         * @description Reload the grid of private announcement
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadPrivateAnnouncements = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return privateAnnouncementService
                .loadPrivateAnnouncements()
                .then(function (result) {
                    self.privateAnnouncements = result;
                    self.selectedPrivateAnnouncements = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single private announcement
         * @param privateAnnouncement
         * @param $event
         */
        self.removePrivateAnnouncement = function (privateAnnouncement, $event) {
            privateAnnouncementService
                .controllerMethod
                .privateAnnouncementDelete(privateAnnouncement, $event)
                .then(function () {

                    if (_checkCurrentOu(privateAnnouncement)) {
                        privateAnnouncementService.getPrivateAnnouncementByOUID();
                    }

                    self.reloadPrivateAnnouncements(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected private announcements
         * @param $event
         */
        self.removeBulkPrivateAnnouncements = function ($event) {
            privateAnnouncementService
                .controllerMethod
                .privateAnnouncementDeleteBulk(self.selectedPrivateAnnouncements, $event)
                .then(function () {
                    for (var i = 0; i < self.selectedPrivateAnnouncements.length; i++) {
                        if (_checkCurrentOu(self.selectedPrivateAnnouncements[i])) {
                            privateAnnouncementService.getPrivateAnnouncementByOUID();
                            break;
                        }
                    }

                    self.reloadPrivateAnnouncements(self.grid.page);
                });
        };

        /**
         * @description Change the status of private announcement
         * @param privateAnnouncement
         */
        self.changeStatusPrivateAnnouncement = function (privateAnnouncement) {
            self.statusServices[privateAnnouncement.status](privateAnnouncement)
                .then(function () {
                    if (_checkCurrentOu(privateAnnouncement)) {
                        privateAnnouncementService.getPrivateAnnouncementByOUID();
                    }
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    privateAnnouncement.status = !privateAnnouncement.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected private announcements
         * @param status
         */
        self.changeStatusBulkPrivateAnnouncements = function (status) {
            self.statusServices[status](self.selectedPrivateAnnouncements).then(function () {

                for (var i = 0; i < self.selectedPrivateAnnouncements.length; i++) {
                    if (_checkCurrentOu(self.selectedPrivateAnnouncements[i])) {
                        privateAnnouncementService.getPrivateAnnouncementByOUID();
                        break;
                    }
                }

                self.reloadPrivateAnnouncements(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };

        /**
         * function to disable status switch if date < current date
         * @param privateAnnouncement
         * @returns {boolean}
         */
        self.disableStatus = function (privateAnnouncement) {
            var today = new Date();
            if (privateAnnouncement.endDate)
                return moment(privateAnnouncement.endDate, "YYYY-MM-DD").valueOf() < moment(new Date(today.getFullYear(), today.getMonth(), today.getDate()), "YYYY-MM-DD").valueOf();
            else
                return false;
        };

        self.openAnnouncementMessageBodyDialog = function (privateAnnouncement, $event) {
            publicAnnouncementService
                .controllerMethod
                .showAnnouncementMessageBody(privateAnnouncement, $event);
        };
    });
};