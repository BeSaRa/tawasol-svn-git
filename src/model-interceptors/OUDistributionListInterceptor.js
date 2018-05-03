module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      organizationService,
                      generator) {
        'ngInject';

        var modelName = 'OUDistributionList';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouid = model.ouid.hasOwnProperty('id') ? model.ouid.id : model.ouid;
            model.distributionList = generator.interceptSendInstance('DistributionList', model.distributionList);
            delete model.distributionList.relatedOus;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.ouid = _.find(organizationService.organizations, function (organization) {
                return organization.id === model.ouid;
            });
            return model;
        });

    })
};