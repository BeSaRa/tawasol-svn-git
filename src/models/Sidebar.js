module.exports = function (app) {
    app.factory('Sidebar', function () {
        'ngInject';
        return function Sidebar(model) {
            this.id = null;
            this.code = null;
            this.isOpen = null;
            this.isLockedOpen = null;

            if (model)
                angular.extend(this, model);


            Sidebar.prototype.toggle = function () {
                var self = this;
                return self.isOpen = !self.isOpen;
            };

            Sidebar.prototype.toggleLocked = function () {
                var self = this;
                return self.isLockedOpen = !self.isLockedOpen;
            }


        }
    });
};