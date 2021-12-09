module.exports = function (app) {
    app.factory('TaskStatus', function () {
        'ngInject';
        this.InProgress = 0;
        this.Completed = 1;
        this.Cancelled = 2;
        this.Error = 3;
        return this;
    })
};
