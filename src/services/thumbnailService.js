module.exports = function (app) {
    app.service('thumbnailService', function () {
        'ngInject';
        var self = this;
        self.serviceName = 'thumbnailService';
        self.latestActiveId = null;
        self.sticky = false;


        self.setLatestActiveId = function (activeId) {
            self.latestActiveId = activeId;
        };

        self.hasActiveId = function (activeId) {
            return self.latestActiveId === activeId;
        };

        self.stickyThumbnail = function () {
            self.sticky = true;
        };

        self.removeStickyThumbnail = function () {
            self.sticky = false;
        };


    });
};