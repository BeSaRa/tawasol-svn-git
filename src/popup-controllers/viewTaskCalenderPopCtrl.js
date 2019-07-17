module.exports = function (app) {
    app.controller('viewTaskCalenderPopCtrl', function (taskItem, employeeService, viewDocumentService, taskService, $scope, task, gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'viewTaskCalenderPopCtrl';

        self.task = task;

        self.taskItem = taskItem;

        self.employee = employeeService.getEmployee();

        self.currentParticipantId = Number(self.employee.id + '' + self.employee.getOUID());

        self.participant = _.find(self.task.taskParticipants, function (participant) {
            return participant.participantId === self.currentParticipantId;
        });

        self.viewDocument = function (correspondence, $event) {
            var documentClass = task.correspondence.classDescription;
            var actions = taskService.gridActions[documentClass.toLowerCase()];
            viewDocumentService.viewQueueDocument(correspondence, actions, 'review' + documentClass, $event);
        };

        self.truncateSubject = gridService.getGridSubjectTruncateByGridName(gridService.grids.others.viewTask);
        self.setTruncateSubject = function ($event) {
            gridService.setGridSubjectTruncateByGridName(gridService.grids.others.viewTask, self.truncateSubject);
        };

    });
};
