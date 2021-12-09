module.exports = function (app) {
    require('./url-parser-directive')(app);
    require('./urlParserDirectiveCtrl')(app);
};
