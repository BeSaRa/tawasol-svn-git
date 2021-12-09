module.exports = function (app) {
    require('./chatBotDirectiveCtrl')(app);
    require('./chat-bot-directive')(app);
    require('./style.scss');
}
