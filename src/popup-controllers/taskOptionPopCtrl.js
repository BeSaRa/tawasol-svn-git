module.exports = function (app) {
    app.controller('taskOptionPopCtrl', function (task, dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'taskOptionPopCtrl';

        self.task = task;

        self.callbacks = [
            {
                id: 1,
                label: 'edit_task',
                callback: 'editTaskDialog',
                validate: function (task) {
                    return task.creator;
                }
            },

            {
                id: 2,
                label: 'make_task_complete',
                callback: function (task) {
                    return task.creator ? 'setTaskComplete' : 'setTaskParticipantComplete';
                },
                validate: function (task) {
                    return !task.participantCompletionDate;
                }
            },
            {
                id: 3,
                label: 'send_reminder_for_all_participants',
                callback: 'sendReminderForAllParticipants',
                validate: function (task) {
                    return task.creator;
                }
            }

        ];

        self.runButtonCallback = function (button) {
            var callback = typeof button.callback === 'function' ? button.callback(self.task) : button.callback;
            return dialog.hide(callback);
        }


    });
};
