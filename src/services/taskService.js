module.exports = function (app) {
    app.service('taskService', function (urlService, TaskCalenderItem, $timeout, moment, configurationService, ouApplicationUserService, TaskParticipant, cmsTemplate, employeeService, dialog, $http, $q, generator, Task, _) {
        'ngInject';
        var self = this;
        self.serviceName = 'taskService';

        self.tasks = [];

        self.calender = null;

        self.classes = ['task-pending', 'task-canceled', 'task-in-progress', 'task-completed', 'task-undefined-state'];

        self.gridActions = {};

        self.events = [];

        self.reminders = [];

        self.loadReminders = function () {
            return $http
                .get(urlService.tasks + '/calender-remainders')
                .then(function (result) {
                    self.reminders = generator.interceptReceivedCollection('TaskCalenderItem', generator.generateCollection(result.data.rs, TaskCalenderItem));
                    return self.reminders;
                })
        };


        self.hasQueueController = function (queueName, callback) {
            queueName = queueName.toLowerCase();
            if (!self.gridActions.hasOwnProperty(queueName)) {
                self.gridActions[queueName] = callback();
            }
        };

        self.getQueueController = function (documentClass) {
            return self.gridActions[documentClass.toLowerCase()];
        };

        self.setCalender = function (calender) {
            self.calender = calender;
        };

        self.getCalender = function () {
            return $timeout(function () {
                return self.calender;
            });
        };

        self.reloadCalender = function (state) {
            return self.loadEvents(self.calender.view.activeStart, self.calender.view.activeEnd, state)
                .then(function () {
                    return self.calender.refetchEvents();
                });
        };


        /**
         * @description load tasks from server.
         * @returns {Promise|tasks}
         */
        self.loadTasks = function () {
            return $http.get(urlService.tasks).then(function (result) {
                self.tasks = generator.generateCollection(result.data.rs, Task, self._sharedMethods);
                self.tasks = generator.interceptReceivedCollection('Task', self.tasks);
                return self.tasks;
            });
        };
        /**
         * @description get tasks from self.tasks if found and if not load it from server again.
         * @returns {Promise|tasks}
         */
        self.getTasks = function () {
            return self.tasks.length ? $q.when(self.tasks) : self.loadTasks();
        };
        /**
         * @description add new task to service
         * @param task
         * @return {Promise|Task}
         */
        self.addTask = function (task) {
            return $http
                .post(urlService.tasks + '/add-task',
                    generator.interceptSendInstance('Task', task))
                .then(function (result) {
                    task.id = result.data.rs.id;
                    _.map(task.taskParticipants, function (participant, index) {
                        task.taskParticipants[index].id = result.data.rs.taskParticipants[index].id;
                    });
                    return task;
                });
        };
        /**
         * @description make an update for given task.
         * @param task
         * @return {Promise|Task}
         */
        self.updateTask = function (task) {
            return $http
                .put(urlService.tasks,
                    generator.interceptSendInstance('Task', task))
                .then(function () {
                    return task;
                });
        };
        /**
         * @description delete given classification.
         * @param task
         * @return {Promise}
         */
        self.deleteTask = function (task) {
            var id = task.hasOwnProperty('id') ? task.id : task;
            return $http
                .delete((urlService.tasks + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteTask, self.updateTask);

        /**
         * @description get task by taskId
         * @param taskId
         * @returns {Task|undefined} return Task Model or undefined if not found.
         */
        self.getTaskById = function (taskId) {
            taskId = taskId instanceof Task ? taskId.id : taskId;
            return _.find(self.tasks, function (task) {
                return Number(task.id) === Number(taskId);
            });
        };
        /**
         * @description get available user for current login user by his REG OU.
         * @return {TaskParticipant[]}
         */
        self.getAvailableUsers = function () {
            return ouApplicationUserService
                .searchByCriteria({
                    regOu: employeeService.getEmployee().getRegistryOUID(),
                    includeChildOus: true,
                    outOfOffice: false
                }, true)
                .then(function (result) {
                    return generator.interceptReceivedCollection('TaskParticipant', _.map(result, function (user) {
                        return (new TaskParticipant()).generateFromOUApplicationUser(user);
                    }));
                })
        };

        self.deleteTaskParticipant = function (task, taskParticipant) {
            return $http
                .delete(urlService.tasks + '/participant-id/' + taskParticipant.id)
                .then(function (result) {
                    return taskParticipant;
                });
        };

        self.saveTaskParticipant = function (task, taskParticipant) {
            return $http
                .post(urlService.tasks + '/task-id/' + task.id + '/participant', generator.interceptSendInstance('TaskParticipant', taskParticipant))
                .then(function (result) {
                    taskParticipant.id = result.data.rs.id;
                    return taskParticipant;
                });
        };


        self.updateTaskParticipant = function (task, taskParticipant) {
            return $http
                .put(urlService.tasks + '/task-id/' + task.id + '/participant', generator.interceptSendInstance('TaskParticipant', taskParticipant))
                .then(function (result) {
                    taskParticipant.id = result.data.rs.id;
                    taskParticipant.completionDate = result.data.rs.completionDate;
                    return taskParticipant;
                });
        };

        self.changeTaskParticipantDuration = function (taskId, taskParticipant) {
            return $http
                .put(urlService.tasks + '/update-task-participant/task-id/' + taskId, generator.interceptSendInstance('TaskParticipant', taskParticipant));
        };
        /**
         * load events by date from / to
         * @param fromDate
         * @param toDate
         * @param state
         * @param ignoreMapping
         * @returns {*}
         */
        self.loadEvents = function (fromDate, toDate, state, ignoreMapping) {
            return $http.get(urlService.tasks + '/calender', {
                params: {
                    fromDate: generator.getTimeStampFromDate(fromDate),
                    toDate: generator.getTimeStampFromDate(toDate),
                    taskState: state && state.hasOwnProperty('lookupKey') ? state.lookupKey : state
                }
            }).then(function (result) {
                if (ignoreMapping)
                    return result;
                self.events = _.map(result.data.rs, function (event) {
                    event.title = event.taskTitle;
                    event.start = event.creator ? event.taskStartDate : event.participantStartDate;
                    event.end = event.creator ? event.taskDueDate : event.participantDueDate;
                    event.editable = (event.creator && event.taskState !== 3);
                    event.classNames = event.creator ? self.classes[event.taskState] : self.classes[event.participantTaskState];
                    event.startEditable = false;
                    return event;
                });
            });
        };
        /**
         * @description open setting for task participant
         * @param taskParticipant
         * @param task
         * @param editMode
         * @param fromView
         * @returns {promise}
         */
        self.openSettingForParticipant = function (taskParticipant, task, editMode, fromView) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('task-participant-setting'),
                    controller: 'taskParticipantSettingPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        editMode: editMode,
                        taskParticipant: taskParticipant,
                        task: task,
                        fromView: fromView
                    }
                });
        };

        self.completeTask = function (taskId) {
            return $http.put(urlService.tasks + '/complete/task-id/' + taskId, {});
        };

        self.completeTaskParticipant = function (taskId, taskParticipantId) {
            return $http.put(urlService.tasks + '/complete/task-id/' + taskId + '/participant-id/' + taskParticipantId, {});
        };

        self.sendReminderForAllTaskParticipants = function (taskId) {
            return $http.put(urlService.tasks + '/task-id/' + taskId + '/send-reminder', {});
        };

        self.findTaskById = function (taskId) {
            taskId = taskId.hasOwnProperty('id') ? taskId.id : taskId;
            return $http
                .get(urlService.tasks + '/' + taskId)
                .then(function (result) {
                    return generator.interceptReceivedInstance('Task', generator.generateInstance(result.data.rs, Task));
                });
        };

        self.viewCalenderTask = function (task, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('view-task-calender'),
                    controller: 'viewTaskCalenderPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        taskItem: task
                    },
                    resolve: {
                        task: function () {
                            'ngInject';
                            return self.findTaskById(task.taskId);
                        }
                    }
                })
        };


        self.controllerMethod = {
            taskAdd: function (startDate, dueDate, allDay) {
                var employee = employeeService.getEmployee();
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('task'),
                        controller: 'taskPopupCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            task: new Task({
                                allDay: allDay,
                                userId: employee.id,
                                ouId: employee.getOUID(),
                                startDate: startDate ? startDate : new Date(),
                                dueDate: dueDate ? dueDate : null,
                                priorityLevel: 0, // normal
                                taskState: 2, // inProgress
                                startTime: allDay ? null : (startDate ? moment(startDate).format('HH:mm') : configurationService.DEFAULT_START_TASK_TIME),
                                endTime: allDay ? null : (dueDate ? moment(dueDate).format('HH:mm') : null)
                            }),
                            correspondence: false,
                            editMode: false
                        },
                        resolve: {
                            availableUsers: function () {
                                'ngInject';
                                return self.getAvailableUsers();
                            }
                        }
                    });
            },
            taskEdit: function (taskId) {
                var employee = employeeService.getEmployee();
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('task'),
                        controller: 'taskPopupCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            correspondence: false
                        },
                        resolve: {
                            task: function () {
                                return self.findTaskById(taskId);
                            },
                            availableUsers: function () {
                                'ngInject';
                                return self.getAvailableUsers();
                            }
                        }
                    });
            },
            addCorrespondenceTask: function (correspondence, $event) {
                var employee = employeeService.getEmployee();
                var info = correspondence.getInfo();
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('task'),
                        controller: 'taskPopupCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            editMode: false
                        },
                        resolve: {
                            task: function () {
                                return new Task({
                                    allDay: true,
                                    userId: employee.id,
                                    ouId: employee.getOUID(),
                                    startDate: new Date(),
                                    dueDate: null,
                                    priorityLevel: 0, // normal
                                    taskState: 2, // inProgress
                                    startTime: null,
                                    endTime: null,
                                    documentVSID: info.vsId,
                                    docClassId: info.docClassId,
                                    correspondence: info.isWorkItem() ? correspondence.convertToCorrespondence() : correspondence
                                });
                            },
                            availableUsers: function () {
                                'ngInject';
                                return self.getAvailableUsers();
                            }
                        }
                    });
            }
        };

    });
};
