const path = require('path');
const webpack = require('webpack');
const NGAnnotate = require('ng-annotate-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function (env) {
    const cssResolver = isProduction(env) ? {loader: MiniCssExtractPlugin.loader} : {
        loader: 'style-loader',
        options: {sourceMap: !isProduction(env)}
    };

    return {
        mode: isProduction(env) ? env.mode : 'development',
        entry: './src/app.js',
        output: {
            path: path.resolve(__dirname),
            publicPath: '/',
            filename: 'dist/js/bundle.js'
        },
        devtool: !isProduction(env) ? 'eval' : false,
        devServer: {
            hot: true,
            open: true,
            stats: "errors-only"
        },
        module: {
            rules: [
                // load html as text by raw loader
                {test: /\.html$/i, use: 'raw-loader'},
                {
                    test: /\.(css|scss)$/,
                    use: [
                        cssResolver,
                        {loader: 'css-loader', options: {sourceMap: !isProduction(env)}},
                        {loader: 'resolve-url-loader'},
                        {loader: 'sass-loader', options: {sourceMap: true}}
                    ]
                },
                {
                    test: /\.(ttf|eot|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: 'dist/fonts/[name].[ext]',
                            useRelativePath: false
                        }
                    }
                },
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
        performance: {
            hints: false
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
            new NGAnnotate()
        ].concat((!isProduction(env) ? [new webpack.HotModuleReplacementPlugin()] : [
            new MiniCssExtractPlugin({
                filename: 'dist/css/style.css'
            })
        ]))
    };
};


function isProduction(env) {
    return env && env.mode === 'production'
}
