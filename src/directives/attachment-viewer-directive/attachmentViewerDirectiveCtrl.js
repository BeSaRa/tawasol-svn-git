module.exports = function (app) {
    app.controller('attachmentViewerDirectiveCtrl', function (thumbnailService) {
        'ngInject';
        var self = this;
        self.controllerName = 'attachmentViewerDirectiveCtrl';
        self.images = [];
        self.loading = true;
        self.latestLoading = null;
        self.thumbnailService = thumbnailService;

        self.loadItemThumbnails = function () {
            return self
                .correspondence
                .loadThumbnails()
                .then(function (images) {
                    self.loading = false;
                    self.images = images.length ? [images.shift()] : [];
                });
        };

        self.getItemThumbnails = function () {
            return self.images;
        };

        self.deactivateItem = function () {
            self.loading = true;
        };

        self.preventClick = function ($event) {
            console.log($event);
            $event.stopPropagation();
        }
    });
};