module.exports = function (app) {
    app.run(function (CMSModelInterceptor, _, Outgoing, Incoming, TaskParticipant, Internal, generator, moment, Information, taskService) {
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
            } else {
                model.startDate = moment(model.startDate).startOf('day');
                model.dueDate = moment(moment(model.dueDate).endOf('day')).subtract(1, 'hours');
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
                return generator.interceptReceivedInstance('TaskParticipant', new TaskParticipant(participant));
            });
            model.userId = new Information(model.userInfo);
            model.ouId = new Information(model.ouInfo);

            return model;
        });

    })
};
