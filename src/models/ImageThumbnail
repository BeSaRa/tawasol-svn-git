module.exports = function (app) {
    app.factory('ImageThumbnail', function (CMSModelInterceptor, $sce, $q) {
        'ngInject';
        return function ImageThumbnail(model) {
            var self = this;
            self.vsId = null;
            self.mimeType = null;
            self.name = null;
            self.thumbnailUrl = null;
            self.mainDocument = false;
            self.url = null;
            self.viewer = null;
            self.title = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model) {
                angular.extend(this, model);
                self.url = $sce.trustAsResourceUrl(self.thumbnailUrl);
            }

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ImageThumbnail.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            ImageThumbnail.prototype.setVsId = function (vsId) {
                this.vsId = vsId;
                return this;
            };
            ImageThumbnail.prototype.setMainIfEqual = function (vsId) {
                this.mainDocument = vsId === this.vsId;
                return this;
            };
            ImageThumbnail.prototype.isMainDocument = function (promise) {
                return this.mainDocument ? (promise ? $q.resolve(true) : true) : (promise ? $q.reject(false) : false);
            };
            ImageThumbnail.prototype.setViewer = function (url) {
                this.viewer = url;
                return this;
            };
            ImageThumbnail.prototype.setTitle = function (title) {
                this.title = title;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ImageThumbnail', 'init', this);
        }
    })
};