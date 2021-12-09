module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      documentCommentService,
                      applicationUserService,
                      organizationService,
                      langService,
                      ApplicationUser,
                      _,
                      Information) {
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
            if (angular.isArray(model.includedIDs) && model.includedIDs.length) {
                model.includedIDs = JSON.stringify(_.map(model.includedIDs, 'id'));
            } else {
                model.includedIDs = JSON.stringify([]);
            }
            if (angular.isArray(model.excludedIDs) && model.excludedIDs.length) {
                model.excludedIDs = JSON.stringify(_.map(model.excludedIDs, 'id'));
            } else {
                model.excludedIDs = JSON.stringify([]);
            }
            delete model.includedList;
            delete model.excludedList;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            /*model.includedIDs = _.map(JSON.parse(model.includedIDs), function (item) {
                if (model.isPerOU) {
                    item = organizationService.getOrganizationById(item);
                    item = angular.extend(item, {display: item[langService.current + 'Name']});
                } else {
                    item = applicationUserService.getApplicationUserById(item) || item;
                    if (typeof item === 'number')
                        item = new ApplicationUser({id: item});
                    item = angular.extend(item, {display: item[langService.current + 'FullName']});
                }
                return item;
            });
            model.excludedIDs = _.map(JSON.parse(model.excludedIDs), function (item) {
                if (model.isPerOU) {
                    item = organizationService.getOrganizationById(item);
                    item = angular.extend(item, {display: item[langService.current + 'Name']});
                } else {
                    item = applicationUserService.getApplicationUserById(item) || item;
                    if (typeof item === 'number')
                        item = new ApplicationUser({id: item});
                    item = angular.extend(item, {display: item[langService.current + 'FullName']});
                }
                return item;
            });*/
            model.createorInfo = model.createorInfo ? new Information(model.createorInfo) : new Information();
            model.includedIDs = [];
            model.excludedIDs = [];
            if (model.includedList.length) {
                model.includedIDs = _.map(model.includedList, function (included) {
                    included = new Information(included);
                    return included;
                });
            }
            if (model.excludedList.length) {
                model.excludedIDs = _.map(model.excludedList, function (excluded) {
                    excluded = new Information(excluded);
                    return excluded;
                });
            }
            return model;
        });

    })
};
