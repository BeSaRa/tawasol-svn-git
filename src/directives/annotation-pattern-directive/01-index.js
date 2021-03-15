module.exports = function (app) {
    require('./annotation-pattern-directive')(app);
    require('./annotationPatternDirectiveCtrl')(app);
};
