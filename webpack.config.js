var path = require('path'),
    webpack = require('webpack'),
    NGAnnotate = require('ng-annotate-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname),
    entry: './src/app.js',
    devtool: 'eval',
    output: {
        path: path.resolve(__dirname),
        filename: 'dist/js/bundle.js',
        publicPath: '/'
    },
    devServer: {
        hot: true,
        inline: true,
        stats: "errors-only",
        open: true
    },
    module: {
        loaders: [
            {
                test: /\.html$/,
                use: [
                    {loader: 'raw-loader'}
                ]
            },
            {
                test: /\.(css|scss)$/,
                use: [
                    {loader: 'style-loader', options: {sourceMap: true}},
                    {loader: 'css-loader', options: {sourceMap: true}},
                    {loader: 'resolve-url-loader'},
                    {loader: 'sass-loader', options: {sourceMap: true}}
                ]
            },
            {test: /\.(ttf|eot|woff(2)?)(\?[a-z0-9=&.]+)?$/, loaders: ['file-loader']},
            {
                test: /\.(gif|svg|png|jpg)$/i,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'assets/images/[name].[ext]',
                        useRelativePath: false
                    }
                }
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery',
            'window.jQuery': 'jquery',
            html2canvas: 'html2canvas',
            jsPDF: 'jspdf',
            tinycolor: 'tinycolor2',
            CountUp: 'countup.js'
        }),
        new webpack.HotModuleReplacementPlugin(),
        new NGAnnotate()
    ]
};