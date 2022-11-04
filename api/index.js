// 'use strict'
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// /api?url=https://xaoxuu.com
var https = require('https');
var data = {};

export default function handler(req, res) {
    const url = req.query['url'];
    console.log('url >>', url);
    data['url'] = url;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    const request = https.get(url, (response) => {
        let html = '';
        response.on('data', (chunk) => {
            html = html + chunk.toString();
        });
        response.on('end', () => {
            console.log('end >>');
            getInfo(url, html, () => {
                console.log('data >>', data);
                res.send(data);
            });
        });
    });
    request.on('error', error => {
        console.log('error >>', error);
        res.send({});
    })
    request.end();
}

/**
 * Determine if it is a ['https://', 'http://', '//'] protocol
 * @param {String} url Website url
 * @returns {Boolean}
 */
function isHttp(url) {
    return /^(https?:)?\/\//g.test(url)
}

function getInfo(link, html, callback) {
    try {
        let title, icon, desc;
        const { document } = (new JSDOM(html)).window;
        
        // title
        title = document.querySelector('title');
        if (title) {
            title = title.textContent;
        }
        data.title = title;

        // desc
        desc = document.querySelector('head meta[name="description"]');
        if (desc) {
            desc = desc.content;
        }
        data.desc = desc;

        // icon
        let tmp = document.querySelector('head link[rel="apple-touch-icon"]')
        if (!tmp) {
            tmp = document.querySelector('head link[rel="icon"]')
        }
        icon = tmp && tmp.getAttribute('href')

        if (/^data:image/.test(icon)) {
            icon = '';
        }

        // If there is no src then get the site icon
        if (!icon) {
            const links = [].slice.call(document.querySelectorAll('link[rel][href]'))
            icon = links.find((_el) => _el.rel.includes('icon'))
            icon = icon && icon.getAttribute('href')
        }

        // If `icon` is not the ['https://', 'http://', '//'] protocol, splice on the `origin` of the a tag
        if (icon && !isHttp(icon)) {
            icon = new URL(link).origin + icon;
        }
        data.icon = icon;

        callback();
    } catch (error) {
        console.log('error >>', error);
        callback();
    }
}
