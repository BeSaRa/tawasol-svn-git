module.exports = function (app) {
    app.controller('publicAnnouncementCtrl', function (lookupService,
                                                       publicAnnouncementService,
                                                       publicAnnouncements,
                                                       $q,
                                                       $filter,
                                                       langService,
                                                       toast,
                                                       contextHelpService,
                                                       dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'publicAnnouncementCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('public-announcements');
        /**
         * @description All public announcements
         * @type {*}
         */
        self.publicAnnouncements = publicAnnouncements;

        /**
         * @description Contains the selected public announcements
         * @type {Array}
         */
        self.selectedPublicAnnouncements = [];

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
                        return (self.publicAnnouncements.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for public announcements
         */
        self.statusServices = {
            'activate': publicAnnouncementService.activateBulkPublicAnnouncements,
            'deactivate': publicAnnouncementService.deactivateBulkPublicAnnouncements,
            'true': publicAnnouncementService.activatePublicAnnouncement,
            'false': publicAnnouncementService.deactivatePublicAnnouncement
        };

        /**
         * @description Opens dialog for add new public announcement
         * @param $event
         */
        self.openAddPublicAnnouncementDialog = function ($event) {
            publicAnnouncementService
                .controllerMethod
                .publicAnnouncementAdd($event)
                .then(function () {
                    self.reloadPublicAnnouncements(self.grid.page);
                })
        };

        /**
         * @description Opens dialog for edit public announcement
         * @param $event
         * @param publicAnnouncement
         */
        self.openEditPublicAnnouncementDialog = function (publicAnnouncement, $event) {
            publicAnnouncementService
                .controllerMethod
                .publicAnnouncementEdit(publicAnnouncement, $event)
                .then(function () {
                    self.reloadPublicAnnouncements(self.grid.page);
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.publicAnnouncements = $filter('orderBy')(self.publicAnnouncements, self.grid.order);
        };

        /**
         * @description Reload the grid of public announcement
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadPublicAnnouncements = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return publicAnnouncementService
                .loadPublicAnnouncements()
                .then(function (result) {
                    self.publicAnnouncements = result;
                    self.selectedPublicAnnouncements = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single public announcement
         * @param publicAnnouncement
         * @param $event
         */
        self.removePublicAnnouncement = function (publicAnnouncement, $event) {
            publicAnnouncementService
                .controllerMethod
                .publicAnnouncementDelete(publicAnnouncement, $event)
                .then(function () {
                    self.reloadPublicAnnouncements(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected public announcements
         * @param $event
         */
        self.removeBulkPublicAnnouncements = function ($event) {
            publicAnnouncementService
                .controllerMethod
                .publicAnnouncementDeleteBulk(self.selectedPublicAnnouncements, $event)
                .then(function () {
                    self.reloadPublicAnnouncements(self.grid.page);
                });
        };

        /**
         * @description Change the status of public announcement
         * @param publicAnnouncement
         */
        self.changeStatusPublicAnnouncement = function (publicAnnouncement) {
            self.statusServices[publicAnnouncement.status](publicAnnouncement)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    publicAnnouncement.status = !publicAnnouncement.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected public announcements
         * @param status
         */
        self.changeStatusBulkPublicAnnouncements = function (status) {
            self.statusServices[status](self.selectedPublicAnnouncements).then(function () {
                self.reloadPublicAnnouncements(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };

        self.openAnnouncementMessageBodyDialog = function (publicAnnouncement, $event) {
            publicAnnouncementService
                .controllerMethod
                .showAnnouncementMessageBody(publicAnnouncement, $event);
        };

    });
};