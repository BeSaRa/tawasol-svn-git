module.exports = function (app) {
    require('./localization-module-converter-directive')(app);
    require('./localizationModuleConverterDirectiveCtrl')(app);
};