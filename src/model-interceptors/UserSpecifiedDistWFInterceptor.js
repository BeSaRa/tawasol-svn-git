module.exports = function (app) {
    app.run(function (CMSModelInterceptor, WFOrganization) {
        'ngInject';
        var modelName = 'UserSpecifiedDistWF';
        
        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouId = model.ouId && model.ouId.hasOwnProperty('id') ? model.ouId.id : model.ouId;
            model.userId = model.userId && model.userId.hasOwnProperty('id') ? model.userId.id : model.userId;
            model.toOUID = model.toOUID && model.toOUID.hasOwnProperty('id') ? model.toOUID.id : model.toOUID;
            model.withSubs = model.withSubs || false;

            delete model.ouInfo;
            delete model.userInfo;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.ouInfo = new WFOrganization(model.ouInfo);
            model.withSubs = model.withSubs || false;
            return model;
        });
        
    })
};
