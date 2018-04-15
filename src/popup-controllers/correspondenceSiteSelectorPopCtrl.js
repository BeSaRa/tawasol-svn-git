module.exports = function (app) {
    app.controller('correspondenceSiteSelectorPopCtrl', function (_, langService, dialog, correspondenceSiteService, excluded) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceSiteSelectorPopCtrl';

        self.selectedCorrespondenceSites = [];

        self.correspondenceSite = null;

        self.selectedCorrespondenceSiteGrid = [];

        self.correspondenceSites = correspondenceSiteService.correspondenceSites;
        console.log(self.correspondenceSites);

        self.grid = {
            limit: 10, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [10, 15, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.ouCorrespondenceSites.length + 21);
                }
            }]
        };

        // the excluded must be CorrespondenceSite Instance.
        self.excluded = _.map(excluded, 'id');

        self.excludeIfExists = function (correspondenceSite) {
            return self.excluded.indexOf(correspondenceSite.id) === -1;
        };

        self.sendSelectedCorrespondenceSite = function () {
            dialog.hide(self.selectedCorrespondenceSites);
        };

        self.addCorrespondenceSiteToSelectedCorrespondenceSite = function () {
            self.selectedCorrespondenceSites = self.selectedCorrespondenceSites.concat(self.correspondenceSite);
            self.excluded = self.excluded.concat(_.map(self.correspondenceSite, 'id'));
            self.correspondenceSite = null;
            self.selectedCorrespondenceSiteGrid = [];
        };


        self.removeCorrespondenceSite = function (correspondenceSite, doNotClear) {
            var correspondenceSiteId = correspondenceSite.id;
            self.excluded = _.filter(self.excluded, function (id) {
                return correspondenceSiteId !== id;
            });
            self.selectedCorrespondenceSites = _.filter(self.selectedCorrespondenceSites, function (correspondenceSite) {
                return correspondenceSite.id !== correspondenceSiteId;
            });
            if (!doNotClear)
                self.selectedCorrespondenceSiteGrid = [];
        };

        self.isDisabled = function () {
            return !self.correspondenceSite;
        };

        self.removeSelectedCorrespondenceSite = function () {
            for (var i = 0; i < self.selectedCorrespondenceSiteGrid.length; i++) {
                self.removeCorrespondenceSite(self.selectedCorrespondenceSiteGrid[i], true);
            }
            self.selectedCorrespondenceSiteGrid = [];
        };


    });
};