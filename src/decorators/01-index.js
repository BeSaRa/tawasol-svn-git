module.exports = function (app) {
    require('./$mdColorPicker')(app);
    require('./$pagination')(app);
    require('./mdTable')(app);
    require('./$textAngular')(app);
    require('./tooltipDecorator')(app);
};
