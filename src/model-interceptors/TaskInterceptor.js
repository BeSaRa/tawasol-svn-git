module.exports = function (app) {
    app.run(function (CMSModelInterceptor, _, Outgoing, Incoming, Internal, generator, moment, Information, taskService, lookupService) {
        'ngInject';
        var modelName = 'Task';
        var classesMap = {
            0: {
                model: Outgoing,
                name: 'Outgoing'
            },
            1: {
                model: Incoming,
                name: 'Incoming'
            },
            2: {
                model: Internal,
                name: 'Internal'
            },
            Outgoing: 0,
            Incoming: 1,
            Internal: 2
        };


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.addTaskService(taskService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.taskParticipants = _.map(model.taskParticipants, function (participant) {
                return generator.interceptSendInstance('TaskParticipant', participant);
            });

            if (!model.allDay) {
                model.startDate = moment(model.startDate).format('Y-MM-DD');
                model.dueDate = moment(model.dueDate).format('Y-MM-DD');

                model.startDate = model.startDate + ' ' + (model.startTime ? model.startTime + ':00' : '00:00:00');
                model.dueDate = model.dueDate + ' ' + (model.endTime ? model.endTime + ':00' : '23:30:00');

                model.startDate = moment(model.startDate).toDate();
                model.dueDate = moment(model.dueDate).toDate();
            }
            model.userId = model.userId.hasOwnProperty('id') ? model.userId.id : model.userId;
            model.ouId = model.ouId.hasOwnProperty('id') ? model.ouId.id : model.ouId;

            if (model.correspondence) {
                model.documentVSID = model.correspondence.vsId;
                model.docClassId = classesMap[model.correspondence.classDescription];
                delete model.correspondence;
            }
            // delete extra properties
            delete model.userInfo;
            delete model.ouInfo;
            delete model.startTime;
            delete model.endTime;
            delete model.securityLevelLookup;
            delete model.securityLevelIndicator;
            delete model.priorityLevelLookup;
            delete model.priorityLevelIndicator;
            delete model.docClassIndicator;
            delete model.isPaperIndicator;
            delete model.attachmentsIndicator;
            delete model.linkedDocsIndicator;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var startDate = model.startDate, dueDate = model.dueDate;
            model.startDate = moment(startDate).toDate();
            model.startTime = model.allDay ? null : moment(startDate).format('HH:mm');
            model.dueDate = moment(dueDate).toDate();
            model.endTime = model.allDay ? null : moment(dueDate).format('HH:mm');
            model.correspondence = model.correspondence ? generator.interceptReceivedInstance(['Correspondence', classesMap[model.docClassId].name], generator.generateInstance(model.correspondence, classesMap[model.docClassId].model)) : null;
            model.taskParticipants = _.map(model.taskParticipants, function (participant) {
                return generator.interceptReceivedInstance('TaskParticipant', participant);
            });
            model.userId = new Information(model.userInfo);
            model.ouId = new Information(model.ouInfo);

            if (model.correspondence) {
                model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.correspondence.securityLevel);
                model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

                model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.correspondence.priorityLevel);
                model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

                model.attachmentsIndicator = model.correspondence.attachementsNO ? model.getAttachmentsIndicator() : null;
                model.linkedDocsIndicator = model.correspondence.linkedDocsNO ? model.getLinkedDocumentsIndicator() : null;
                model.docClassIndicator = model.correspondence.workFlowName ? model.getDocClassIndicator(model.correspondence.workFlowName) : null;
                model.isPaperIndicator = model.getIsPaperIndicator(model.correspondence.hasOwnProperty('addMethod') ? model.correspondence.addMethod : 1);
            }
            return model;
        });

    })
};
