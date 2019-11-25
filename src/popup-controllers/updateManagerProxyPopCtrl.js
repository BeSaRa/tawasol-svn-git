module.exports = function (app) {
    app.controller('updateManagerProxyPopCtrl', function (_,
                                                          dialog,
                                                          currentUser,
                                                          usersWhoSetProxy,
                                                          organizationService,
                                                          availableProxies,
                                                          ouApplicationUserService) {
        'ngInject';
        var self = this;
        self.controllerName = 'updateManagerProxyPopCtrl';
        console.log('users who set proxy', usersWhoSetProxy);
        console.log('current User', currentUser);
        self.availableProxies = availableProxies;
        self.currentUser = currentUser;
        self.proxyUserSearchText = '';

        self.proxyManagers = [];
        var _createProxyInstance = function () {
            _.map(usersWhoSetProxy, function (user) {
                self.proxyManagers.push({
                    id: user.proxyUser,
                    ouId: user.proxyUserOU,
                    name: user.getTranslatedName(),
                    selectedProxyUser: null
                })
            })
        };
        _createProxyInstance();

        /**
         * @description to check if the current user selected.
         * @param proxyUser
         * @returns {boolean}
         */
        self.isCurrentUser = function (proxyUser) {
            return proxyUser.applicationUser.id === currentUser.applicationUser.id;
        };

        self.setProxyUser = function(proxyManager, $event){
          proxyManager.proxyUser = angular.copy(proxyManager.selectedProxyUser.applicationUser.id);
          proxyManager.proxyOUId = angular.copy(proxyManager.selectedProxyUser.organization.id);
        };

        self.updateManagersProxy = function ($event) {
            ouApplicationUserService.updateManagersProxy(self.proxyManagers, $event)
                .then(function () {
                    dialog.hide(true);
                })
                .catch(function () {
                    dialog.cancel(false);
                })
        };

        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        self.closePopup = function ($event) {
            dialog.cancel(false);
        }
    });
};
