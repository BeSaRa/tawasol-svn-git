module.exports = function (app) {
    app.run(function (CMSModelInterceptor, Information, moment) {
        'ngInject';
        var modelName = 'TaskParticipant';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.userId = model.userId.hasOwnProperty('id') ? model.userId.id : model.userId;
            model.ouId = model.ouId.hasOwnProperty('id') ? model.ouId.id : model.ouId;

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

            model.completionDate = model.taskState === 2 ? null : (model.completionDate ? model.completionDate : new Date());
            // delete extra properties
            delete model.ouInfo;
            delete model.userInfo;
            delete model.startTime;
            delete model.endTime;
            delete model.participantId;
            delete model.display;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var startDate = model.startDate, dueDate = model.dueDate;
            model.startDate = moment(startDate).toDate();
            model.dueDate = moment(dueDate).toDate();
            model.startTime = model.allDay ? null : moment(startDate).format('HH:mm');
            model.endTime = model.allDay ? null : moment(dueDate).format('HH:mm');
            model.ouId = new Information(model.ouInfo || model.ouId);
            model.userId = new Information(model.userInfo || model.userId);
            model.participantId = Number(model.userId.id + '' + model.ouId.id);
            return model;
        });

    })
};
