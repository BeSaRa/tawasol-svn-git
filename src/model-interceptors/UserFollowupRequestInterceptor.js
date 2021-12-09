module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'UserFollowupRequest';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.toUserId = model.toUserId.hasOwnProperty('id') ? model.toUserId.id : model.toUserId;
            model.toOUId = model.toOUId.hasOwnProperty('id') ? model.toOUId.id : model.toOUId;
            model.folderId = (model.folderId && model.folderId.hasOwnProperty('id')) ? model.folderId.id : model.folderId;

            delete model.customAppUser;
            delete model.reason;
            delete model.user;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
