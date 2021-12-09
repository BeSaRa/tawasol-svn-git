module.exports = function (app) {
    require('./document-security-watermark-directive')(app);
    require('./documentSecurityWatermarkDirectiveCtrl')(app);
};