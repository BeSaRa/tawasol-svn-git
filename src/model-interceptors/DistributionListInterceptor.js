module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      ouDistributionListService, 
                      organizationService, 
                      distributionListService, 
                      OUDistributionList,
                      CorrespondenceSiteView,
                      generator) {
        'ngInject';

        var modelName = 'DistributionList';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setDistributionListService(distributionListService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            /*var distributionListMembers = model.distributionListMembers;
            model.distributionListMembers = [];

            angular.forEach(distributionListMembers, function (value, key) {
                model.distributionListMembers.push({
                    "site": {
                        "id": value.id
                    }
                })
            });*/
            model.relatedOus = _.map(model.relatedOus, function () {
                return OUDistributionList();
            });
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            //var distributionListMembers = model.distributionListMembers;
            //model.distributionListMembers = [];

            angular.forEach(model.distributionListMembers, function (value, key) {
                var member = angular.copy(value);
                member  = new CorrespondenceSiteView(member.site);
                member = generator.interceptReceivedInstance('CorrespondenceSiteView', member);
                value.site = member;
            });
            var ouDistributionList = ouDistributionListService.ouDistributionLists;
            var selectedOUs = _.filter(ouDistributionList, function (ouDis) {
                return ouDis.distributionList.id === model.id;
            });
            model.relatedOus = [];
            model.relatedOus = selectedOUs;
            return model;
        });

    })
};