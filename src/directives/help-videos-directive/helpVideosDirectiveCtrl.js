module.exports = function (app) {
    app.controller('helpVideosDirectiveCtrl', function ($scope, LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'gridSearchDirectiveCtrl';
        LangWatcher($scope);
    });
};
