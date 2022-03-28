module.exports = function (app) {
    app.factory('PersonalFollowupStatistics', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function PersonalFollowupStatistics(model) {
            var self = this,
                exportData = {
                    count: 'count',
                    arabic_folder_name: 'folderArName',
                    english_folder_name: 'folderEnName'
                };
            self.count = 0;
            self.folderArName = null;
            self.folderEnName = null;
            self.folderId = null;
            self.userId = null;
            self.userOUId = null;

            if (model)
                angular.extend(this, model);

            PersonalFollowupStatistics.prototype.getExportedData = function () {
                return exportData;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PersonalFollowupStatistics', 'init', this);
        }
    });
};
