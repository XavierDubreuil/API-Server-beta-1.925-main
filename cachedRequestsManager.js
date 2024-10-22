import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";
global.cacheRequests = [];
global.cachedCleanerStarted = false;
let cacheRequestsExpirationTime = serverVariables.get("main.cacheRequestsExpirationTime");
export default class CachedRequestsManager {
    static startCachedRequestsCleaner() {
        setInterval(CachedRequestsManager.flushExpired, cacheRequestsExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic repositories data caches cleaning process started...]");
    }
    static add(url, content, Etag = "") {
        if (!cachedCleanerStarted) {
            cachedCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            cacheRequests.push({
                url,
                content,
                Etag,
                Expire_Time: utilities.nowInSeconds() + cacheRequestsExpirationTime
            });
            console.log(BgWhite + FgBlue, `[content of ${url} has been cached]`);
        }
    }
    static find(url) {
        try {
            if (url != "") {
                for (let cache of cacheRequests) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + cacheRequestsExpirationTime;
                        console.log(BgWhite + FgRed, `[${cache.url} data retrieved from cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[Requests cache error!]", error);
        }
        return null;
    }
    static clear(url) {
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of cacheRequests) {
                if (cache.url == url) {
                    indexToDelete.push(index);
                }
                index++;
            }
            utilities.deleteByIndex(cacheRequests, indexToDelete);
        }
    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of cacheRequests) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgRed, "Cached file content of " + cache.url + " expired");
            }
        }
        cacheRequests = cacheRequests.filter(cache => cache.Expire_Time > now);
    }
    static get(HttpContext) {
        return new Promise(async resolve => {
            if (CachedRequestsManager.find(HttpContext.req.url) != null) {
                let cache = CachedRequestsManager.find(HttpContext.req.url);
                HttpContext.response.JSON(cache.content, cache.ETag, true);
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
        /*
        try{
            if(HttpContext.req.url!="") {
                for( cache of cacheRequests)
                {
                    if(HttpContext.req.url!="" == cache.url)
                    {
                        return HttpContext.response.JSON( cache.content, cache.ETag, true  from cache );
                    }
                }
                return null;
            }
        } catch(error) {
            console.log(BgWhite + FgRed, "[Requests get cache error!]", error);
        }*/
    }
}