module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      ouDistributionListService,
                      organizationService,
                      distributionListService,
                      OUDistributionList,
                      SiteView,
                      generator,
                      _) {
        'ngInject';

        var modelName = 'DistributionList';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setDistributionListService(distributionListService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.distributionListMembers = _.map(model.distributionListMembers, function (member) {
                delete member.site.parentInfo;
                delete member.site.correspondenceSiteType;
                return member;
            });

             model.relatedOus = _.map(model.relatedOus, function () {
                 return OUDistributionList();
             });
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {

            angular.forEach(model.distributionListMembers, function (value, key) {
                var member = angular.copy(value);
                member = new SiteView(member.site);
                member = generator.interceptReceivedInstance('SiteView', member);
                value.site = member;
            });
            var ouDistributionList = ouDistributionListService.ouDistributionLists;

            model.relatedOus = _.filter(ouDistributionList, function (ouDis) {
                return ouDis.distributionList.id === model.id;
            });
            return model;
        });

    })
};