module.exports = function (app) {
    app.factory('EditInDesktopCallback', function (CMSModelInterceptor, $sce, $http) {
        'ngInject';
        return function EditInDesktopCallback(model) {
            var self = this;
            self.url = null;
            self.type = null;
            self.overlay = false;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            EditInDesktopCallback.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            EditInDesktopCallback.prototype.displayOverLay = function () {
                this.overlay = true;
            };

            EditInDesktopCallback.prototype.hideOverlay = function () {
                this.overlay = false;
            };

            EditInDesktopCallback.prototype.reloadContent = function (fullCorrespondence) {
                var self = this;
                return $http.get(self.url).then(function (result) {
                    return self.getContentUrl(result.data.rs, fullCorrespondence);
                });
            };

            EditInDesktopCallback.prototype.getContentUrl = function (correspondence, fullCorrespondence) {
                return this.type === 'workItem' ? this.getWorkItemContent(correspondence, fullCorrespondence) : this.getCorrespondenceContent(correspondence, fullCorrespondence);
            };

            EditInDesktopCallback.prototype.getCorrespondenceContent = function (correspondence, fullCorrespondence) {
                if (correspondence.content.viewURL) {
                    correspondence.content.viewURL = $sce.trustAsResourceUrl(correspondence.content.viewURL);
                }
                if (correspondence.content.editURL) {
                    correspondence.content.editURL = $sce.trustAsResourceUrl(correspondence.content.editURL);
                }
                return fullCorrespondence ? correspondence : correspondence.content;
            };
            EditInDesktopCallback.prototype.getWorkItemContent = function (correspondence, fullCorrespondence) {
                if (correspondence.documentViewInfo.viewURL) {
                    correspondence.documentViewInfo.viewURL = $sce.trustAsResourceUrl(correspondence.documentViewInfo.viewURL);
                }
                if (correspondence.documentViewInfo.editURL) {
                    correspondence.documentViewInfo.editURL = $sce.trustAsResourceUrl(correspondence.documentViewInfo.editURL);
                }
                return fullCorrespondence ? correspondence : correspondence.documentViewInfo;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('editInDesktopCallbackModel', 'init', this);
        }
    })
};
