const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const HOSTS = process.env.HOSTS || ['localhost'];

// /api/v1?url=https://xaoxuu.com
var https = require('https');
var cache = {};

export default function handler(req, res) {
    const referer = req.headers.referer || '';
    if (referer.length > 0) {
      const refererHost = new URL(referer).hostname || '';
      if (!HOSTS.includes(refererHost)) {
          console.error('referer invalid:', referer);
          res.send({"title": "请自部署该服务", "desc": "https://github.com/xaoxuu/site-info-api/"});
          return;
      }
    } else {
      if (!HOSTS.includes('')) {
          console.error('referer can not be empty!');
          res.send({"title": "请自部署该服务", "desc": "https://github.com/xaoxuu/site-info-api/"});
          return;
      }
    }
    console.log('referer ok:', referer);
    const url = req.query['url'];
    if (!url.startsWith('http')) {
        console.error('url invalid:', url);
        res.send({});
        return;
    }
    console.log('url:', url);
    //添加头
    res.setHeader("Vercel-CDN-Cache-Control", "max-age=604800");
    if (cache[url]) {
        console.log('use cache');
        res.send(cache[url]);
    } else {
        main(url, (data) => {
            if (Object.keys(data).length > 0) {
                data.url = url;
                cache[url] = data;
            }
            res.send(data);
        });
    }
}

function main(url, callback) {
    const request = https.get(url, (response) => {
        let html = '';
        response.on('data', (chunk) => {
            html = html + chunk.toString();
        });
        response.on('end', () => {
            console.log('end:', response.statusCode);
            if (response.statusCode != 200) {
                let location = response.headers['location'];
                let isRedirect = [301,302,303,307,308].includes(response.statusCode);
                console.log('isRedirect:', isRedirect);
                console.log('location:', location);
                if (isRedirect && location && location != url) {
                    main(location, callback);
                    return;
                }
            }
            getInfo(url, html, (data) => {
                console.log('data:', data);
                callback(data);
            });
        });
    });
    request.on('error', error => {
        console.error('error:', error);
        callback({});
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
        let data = {};
        let title, icon, desc;
        const { document } = (new JSDOM(html)).window;
        
        // title
        let elTitle = document.querySelector('title');
        if (!elTitle) {
            elTitle = document.querySelector('head meta[property="og:title"]');
        }
        if (elTitle) {
            title = elTitle.text || elTitle.content;
        }
        if (title) {
            data.title = title;
        }

        // desc
        let elDesc = document.querySelector('head meta[property="og:description"]');
        if (!elDesc) {
            elDesc = document.querySelector('head meta[name="description"]');
        }
        if (elDesc) {
            desc = elDesc.content;
        }
        if (desc) {
            data.desc = desc;
        }

        // icon
        let elIcon = document.querySelector('head link[rel="apple-touch-icon"]');
        if (!elIcon) {
            elIcon = document.querySelector('head link[rel="icon"]')
        }
        if (elIcon) {
            icon = elIcon && elIcon.getAttribute('href');
        } else {
            elIcon = document.querySelector('head meta[property="og:image"]');
            if (!elIcon) {
                elIcon = document.querySelector('head meta[property="twitter:image"]');
            }
            if (elIcon) {
                icon = elIcon.content;
            }
        }
        
        if (/^data:image/.test(icon)) {
            icon = '';
        }

        // If there is no src then get the site icon
        if (!icon) {
            const links = [].slice.call(document.querySelectorAll('link[rel][href]'))
            elIcon = links.find((_el) => _el.rel.includes('icon'))
            icon = elIcon && elIcon.getAttribute('href')
        }

        // If `icon` is not the ['https://', 'http://', '//'] protocol, splice on the `origin` of the a tag
        if (icon && !isHttp(icon)) {
            icon = new URL(link).origin + icon;
        }
        if (icon) {
            data.icon = icon;
        }

        callback(data);
    } catch (error) {
        console.log('error >>', error);
        callback({});
    }
}
