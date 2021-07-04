module.exports = function (app) {
    app.controller('chatBotDirectiveCtrl', function (LangWatcher, $sce, $scope, configurationService, tokenService) {
        'ngInject';
        var self = this;
        self.controllerName = 'chatBotDirectiveCtrl';
        LangWatcher($scope);
        self.openStatus = false;

        function _prepareChatBotURL() {
            return $sce.trustAsResourceUrl(_prepareUrl());
        }

        function _prepareUrl() {
            return configurationService.CHAT_BOT.APPEND_TOKEN ? configurationService.CHAT_BOT.URL + '&t=' + tokenService.getToken() : configurationService.CHAT_BOT.URL;
        }

        self.chatBotURL = _prepareChatBotURL();

        self.toggleChatBot = function () {
            self.openStatus = !self.openStatus;
        }

    });
};
