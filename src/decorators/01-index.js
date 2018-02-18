module.exports = function (app) {
    require('./$mdColorPicker')(app);
    require('./$pagination')(app);
    require('./mdTable')(app);
};