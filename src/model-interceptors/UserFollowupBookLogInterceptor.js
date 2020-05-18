module.exports = function (app) {
    app.run(function (CMSModelInterceptor, Information, WFOrganization, generator, langService) {
        'ngInject';
        var modelName = 'UserFollowupBookLog';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.actionStatusInfo;
            delete model.actionDate_vts;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var actionStatusKey = model.getActionStatus(true);
            model.actionStatusInfo = new Information({
              arName: langService.getByLangKey(actionStatusKey, 'ar'),
              enName: langService.getByLangKey(actionStatusKey, 'en')
            });
            model.userInfo = new Information(model.userInfo);
            model.ouInfo = new WFOrganization(model.ouInfo);
            model.actionDate_vts = generator.getDateFromTimeStamp(model.actionDate, true);
            return model;
        });

    })
};
