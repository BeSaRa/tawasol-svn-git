module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      userWorkflowActionService,
                      applicationUserService) {
        'ngInject';

        var modelName = 'WorkflowAction';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setUserWorkflowActionService(userWorkflowActionService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.global) {
                model.relatedUsers = [];
            }
            model.relatedUsers = null;

            delete model.checked;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var reltedUserArr = [];
            var userWorkflowActions = userWorkflowActionService.userWorkflowActions;
            var applicationUsers = applicationUserService.applicationUsers;
            var selectedUsers = _.map(userWorkflowActions, function (userWorkflowAction) {
                if (userWorkflowAction.wfAction.id === model.id) {
                    return userWorkflowAction;
                }
            });
            _.filter(selectedUsers, function (dataSelUser) {
                if (dataSelUser) {
                    _.map(applicationUsers, function (data) {
                        if (data.id === dataSelUser.userId) {
                            data['selectedUserId'] = dataSelUser.id;
                            reltedUserArr.push(data);
                        }
                    });
                }
            });
            model.relatedUsers = reltedUserArr;
            return model;
        });

    })
};
