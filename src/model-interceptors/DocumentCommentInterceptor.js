module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      documentCommentService,
                      applicationUserService,
                      organizationService,
                      langService,
                      _) {
        'ngInject';

        var modelName = 'DocumentComment';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setDocumentCommentService(documentCommentService);
            return model;
        });
        // includedIDs
        // excludedIDs
        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.isPrivate) {
                model.includedIDs = [];
                model.excludedIDs = [];
            }
            model.creator = model.creator.hasOwnProperty('id') ? model.creator.id : model.creator;
            model.includedIDs = JSON.stringify(_.map(model.includedIDs, 'id'));
            model.excludedIDs = JSON.stringify(_.map(model.excludedIDs, 'id'));
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.includedIDs = _.map(JSON.parse(model.includedIDs), function (item) {
                if (model.isPerOU) {
                    item = organizationService.getOrganizationById(item);
                    item = angular.extend(item, {display: item[langService.current + 'Name']});
                } else {
                    item = applicationUserService.getApplicationUserById(item);
                    item = angular.extend(item, {display: item[langService.current + 'FullName']});
                }
                return item;
            });
            model.excludedIDs = _.map(JSON.parse(model.excludedIDs), function (item) {
                if (model.isPerOU) {
                    item = organizationService.getOrganizationById(item);
                    item = angular.extend(item, {display: item[langService.current + 'Name']});
                } else {
                    item = applicationUserService.getApplicationUserById(item);
                    item = angular.extend(item, {display: item[langService.current + 'FullName']});
                }
                return item;
            });
            return model;
        });

    })
};