module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      JobTitle,
                      Theme,
                      Rank,
                      Role,
                      Permission) {
        'ngInject';
        var modelName = 'ApplicationUserLookup';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.jobTitleList = generator.interceptReceivedCollection('JobTitle', generator.generateCollection(model.jobTitleList, JobTitle));
            model.themeList = generator.interceptReceivedCollection('Theme', generator.generateCollection(model.themeList, Theme));
            model.rankList = generator.interceptReceivedCollection('Rank', generator.generateCollection(model.rankList, Rank));
            model.customRoleList = generator.interceptReceivedCollection('Role', generator.generateCollection(model.customRoleList, Role));
            model.permissionList = generator.interceptReceivedCollection('Permission', generator.generateCollection(model.permissionList, Permission));
            return model;
        });

    })
};
