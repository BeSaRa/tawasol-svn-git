module.exports = function (app) {
    require('./_')(app); // lodash
    require('./perfectScrollbar')(app);
    require('./FilterFactory')(app);
    require('./LangWatcher')(app);
    require('./ResizeSensor')(app);
    // it is node functions
    require('./util')(app);
    require('./errorCode')(app);
    require('./ResolveDefer')(app);
    require('./CryptoJS')(app);
    require('./d3')(app);
    require('./PSPDFKit')(app);
};
