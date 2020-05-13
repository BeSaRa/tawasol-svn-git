module.exports = function (app) {
    app.controller('userFollowupScreenCtrl', function (folders, $q, $filter, langService, FollowUpFolder, mailNotificationService, followUpUserService, gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'userFollowupScreenCtrl';

        self.sidebarStatus = false;

        self.selectedFollowupBooks = [];

        self.followupBooks = [];

        self.folders = _prepareFollowupFolders(folders);

        self.selectedFolder = null;


        function _prepareFollowupFolders(folders) {
            return [new FollowUpFolder({
                arName: langService.getKey('followup_folders', 'ar'),
                enName: langService.getKey('followup_folders', 'en'),
                id: 0,
                status: true
            }).setChildren(folders)];
        }

        /**
         * @description get child records to delete
         * @param folder
         * @param array
         * @returns {*}
         */
        function getChildIds(folder, array) {
            for (var i = 0; i < folder.children.length; i++) {
                array.push(folder.children[i].id);
                getChildIds(folder.children[i], array);
            }
            return array;
        }

        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.inbox.folder) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.inbox.folder, self.workItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.inbox.folder, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.inbox.folder),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.inbox.folder, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'generalStepElm.docFullSerial',
                subject: 'generalStepElm.docSubject',
                receivedDate: 'generalStepElm.receivedDate',
                action: function (record) {
                    return self.getSortingKey('action', 'WorkflowAction');
                },
                sender: function (record) {
                    return self.getSortingKey('senderInfo', 'SenderInfo');
                },
                dueDate: 'generalStepElm.dueDate'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.workItems = gridService.searchGridData(self.grid, self.workItemsCopy);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.followupBooks = $filter('orderBy')(self.followupBooks, self.grid.order);
        };

        /**
         * @description reload current folder
         * @param pageNumber
         */
        self.reloadFolders = function (pageNumber) {
            if (!self.selectedFolder)
                return;
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return followUpUserService
                .loadFollowupFolderContent(self.selectedFolder)
                .then(function (followupBooks) {
                    self.followupBooks = followupBooks;
                    // counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    // self.workItems = workItems;
                    // self.workItemsCopy = angular.copy(self.workItems);
                    // self.selectedWorkItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return self.followupBooks;
                });
        };


        /**
         * @description get clicked folder content.
         * @param folder
         * @param $event
         * @returns {*}
         */
        self.getFolderContent = function (folder, $event) {
            if (folder.id === 0)
                return;
            self.selectedFolder = folder;
            return self.reloadFolders(self.grid.page);
        };
        /**
         * @description toggle sidebar folders.
         */
        self.toggleSidebarFolder = function () {
            self.sidebarStatus = !self.sidebarStatus;
        };

        self.reloadFollowupFolders = function () {
            followUpUserService.getFollowupFolders(true)
                .then(function (result) {
                    self.folders = _prepareFollowupFolders(result);
                });
        };

        self.createFolder = function (folder, $event) {
            followUpUserService
                .controllerMethod
                .followupFolderAdd((folder.id ? folder : null), $event)
                .then(function () {
                    self.reloadFollowupFolders();
                });
        };

        self.editFolder = function (folder, $event) {
            followUpUserService
                .controllerMethod
                .followupFolderEdit(folder, $event)
                .then(function () {
                    self.reloadFollowupFolders();
                });
        };

        self.deleteFolder = function (folder, $event) {
            var array = [folder.id];
            getChildIds(folder, array);
            followUpUserService
                .controllerMethod
                .followupFolderDeleteBulk(array.reverse(), $event)
                .then(function () {
                    self.reloadFollowupFolders();

                });
        };

        self.$onInit = function () {
            self.toggleSidebarFolder();
        }
    });
};
