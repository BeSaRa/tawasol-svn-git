module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      WorkflowAction,
                      Information,
                      generator) {
        'ngInject';
        var modelName = 'PredefinedActionMember',
            actionTypeMap = {
                user: 0, // user
                groupMail: 1, //groupMail
                organization: 2, // regOu
            },
            reverseActionTypeMap = {
                0: 'user',
                1: 'groupMail',
                2: 'organization',
            };

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.escalationStatus = (model.escalationStatus && model.escalationStatus.hasOwnProperty('id')) ? model.escalationStatus.lookupKey : model.escalationStatus;
            model.escalationUserOUId = (model.escalationUserId && model.escalationUserId.hasOwnProperty('ouId')) ? model.escalationUserId.ouId : model.escalationUserOUId;
            model.escalationUserId = (model.escalationUserId && model.escalationUserId.hasOwnProperty('id')) ? model.escalationUserId.id : model.escalationUserId;

            model.actionId = model.actionId.hasOwnProperty('id') ? model.actionId.id : model.actionId;
            var toOuId = model.toOUID || model.toOUId;
            model.toOUID = typeof toOuId === 'string' ? Number(toOuId.substr(1)) : toOuId;

            if (model.actionType !== null && typeof model.actionType !== 'undefined' && angular.isString(model.actionType)) {
                model.actionType = _mapActionType(model.actionType);
            }

            if (model.actionType === actionTypeMap.groupMail) {
                model.escalationUserId = null;
                model.escalationUserOUId = null;
                model.escalationStatus = null;
                model.sLADueDate = null;
            }

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.wfActionInfo = new WorkflowAction(model.wfActionInfo);
            return model;
        });

        function _mapActionType(actionType) {
            return actionTypeMap[actionType];
        }

        function _mapReverseActionType(actionType) {
            return reverseActionTypeMap[actionType];
        }

    })
};
