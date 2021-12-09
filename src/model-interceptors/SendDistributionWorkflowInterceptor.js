module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      _) {
        'ngInject';

        var modelName = 'SendDistributionWorkflow';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.normalUsers = prepareUserDistributionWorkflow(model.normalUsers);
            model.managerUsers = prepareUserDistributionWorkflow(model.managerUsers);
            model.favouriteUsers = prepareUserDistributionWorkflow(model.favouriteUsers);
            //model.receivedOUs = prepareReceivedOUDistributionWorkflow(model.receivedOUs);
            //model.mainOUs = prepareMainOUDistributionWorkflow(model.mainOUs);
            model.receivedRegOUs = prepareReceivedRegOuDistributionWorkflow(model.receivedRegOUs);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

        //var commonProperties = ['smsNotification', 'emailNotification', 'action', 'dueDate', 'escalationProcess'];

        /**
         * @description get only required fields from selected user to Send in workflow service
         * @param userDistributionWorkflow
         * @returns {Array}
         */
        var prepareUserDistributionWorkflow = function (userDistributionWorkflow) {
            var distributionWorkflowUsersToSend = [];
            angular.forEach(userDistributionWorkflow, function (val) {
                var tempArr = _.pick(val, ['toUserDomain', 'appUserOUID', 'action', 'dueDate']);
                tempArr.action = tempArr.action.id ? tempArr.action.id : 0;
                tempArr.dueDate = moment(tempArr.dueDate, "YYYY-MM-DD").valueOf();
                tempArr.toUserId = val.id;
                tempArr.escalationUser = "";
                tempArr.escalationStatus = 0;

                distributionWorkflowUsersToSend.push(tempArr);
            });
            return distributionWorkflowUsersToSend;
        };

        /**
         * @description get only required fields from selected user to Send in workflow service
         * @returns {Array}
         * @param receivedOUDistributionWorkflow
         */
        var prepareReceivedOUDistributionWorkflow = function (receivedOUDistributionWorkflow) {
            var distributionWorkflowReceivedOUToSend = [];
            angular.forEach(receivedOUDistributionWorkflow, function (val) {
                var tempArr = _.pick(val, ['toOUId', 'action', 'dueDate']);
                tempArr.action = tempArr.action.id ? tempArr.action.id : 0;
                tempArr.dueDate = moment(tempArr.dueDate, "YYYY-MM-DD").valueOf();
                tempArr.escalationUser = "";
                tempArr.escalationStatus = 0;
                //tempArr.toUserId = val.id;
                distributionWorkflowReceivedOUToSend.push(tempArr);
            });
            return distributionWorkflowReceivedOUToSend;
        };

        /**
         * @description get only required fields from selected user to Send in workflow service
         * @returns {Array}
         * @param mainOUDistributionWorkflow
         */
        var prepareMainOUDistributionWorkflow = function (mainOUDistributionWorkflow) {
            var distributionWorkflowMainOUToSend = [];
            angular.forEach(mainOUDistributionWorkflow, function (val) {
                var tempArr = _.pick(val, ['toOUId', 'action', 'dueDate']);
                tempArr.action = tempArr.action.id ? tempArr.action.id : 0;
                tempArr.dueDate = moment(tempArr.dueDate, "YYYY-MM-DD").valueOf();
                tempArr.escalationUser = "";
                tempArr.escalationStatus = 0;
                distributionWorkflowMainOUToSend.push(tempArr);
            });
            return distributionWorkflowMainOUToSend;
        };

        var prepareReceivedRegOuDistributionWorkflow = function (receivedRegOus) {
            var distributionWorkflowReceivedRegOUToSend = [];
            angular.forEach(receivedRegOus, function (val) {
                var tempArr = _.pick(val, ['toOUId', 'action', 'dueDate']);//, 'escalationProcess'
                tempArr.action = tempArr.action.id ? tempArr.action.id : 0;
                tempArr.dueDate = moment(tempArr.dueDate, "YYYY-MM-DD").valueOf();
                tempArr.escalationUser = "";
                tempArr.escalationStatus = 0;
                tempArr.toOUId = val.toOUId;
                distributionWorkflowReceivedRegOUToSend.push(tempArr);
            });
            return distributionWorkflowReceivedRegOUToSend;
        };

    })
};