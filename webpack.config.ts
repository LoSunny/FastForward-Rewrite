import * as path from 'path';
import * as glob from 'glob';
import * as fs from 'fs';
import type {Configuration as DevServerConfiguration} from "webpack-dev-server";
import type {Configuration} from "webpack";
import CopyPlugin = require('copy-webpack-plugin');
import HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin');
import ZipPlugin = require('zip-webpack-plugin');

const config = (file: string): Configuration | DevServerConfiguration => {
  const config: Configuration = {
    mode: process.env.DEV == null ? 'production' : 'development',
    entry: glob.sync('./src/html/**/*.ts')
      .reduce(function (obj: { [key: string]: string }, el: string) {
        obj[path.parse(el).name] = el;
        return obj
      }, {}),
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist', file),
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [{
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }, {
        test: /\.html$/i,
        type: "asset/resource",
      }]
    },
    plugins: [
      new CopyPlugin({
        patterns: [{
          from: path.resolve(__dirname, 'src', '_locales'),
          to: path.resolve(__dirname, 'dist', file, '_locales')
        }, {
          from: path.resolve(__dirname, 'src', 'icon'),
          to: path.resolve(__dirname, 'dist', file, 'icon')
        }, {
          from: path.resolve(__dirname, 'src', 'icon_disabled'),
          to: path.resolve(__dirname, 'dist', file, 'icon_disabled')
        }, {
          from: path.resolve(__dirname, 'src', 'platform_spec', file, 'manifest.json'),
          to: path.resolve(__dirname, 'dist', file, 'manifest.json')
        },
          {
            from: path.resolve(__dirname, 'src', 'html', '*.html'),
            to: path.resolve(__dirname, 'dist', file, '[name].html')
          }
        ]
      }),
      // @ts-ignore
      new ZipPlugin({
        filename: `${file}.zip`,
        path: path.resolve(__dirname, 'dist'),
      }),
    ],
    optimization: {
      minimize: false,
      minimizer: ['...', new HtmlMinimizerPlugin()],
    },
    devServer: {
      devMiddleware: {
        writeToDisk: true
      }
    }
  }
  return config;
};

export default process.env.DEV == null
  ? fs.readdirSync(path.resolve(__dirname, 'src', 'platform_spec'), 'utf-8')
    .map(file => config(file))
  : fs.readdirSync(path.resolve(__dirname, 'src', 'platform_spec'), 'utf-8')
    .filter(file => file === process.env.DEV)
    .map(file => config(file));
