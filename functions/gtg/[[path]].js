
/**
 * run when requested `https://xxxx/gtg/xxx?id=yyyy`
 * Main Cloudflare Pages Function handler. 
 * Intercepts requests to the `/gtm.js?id=` or `/gtag/js?id=` path and proxies them to Google Tag CDN.
 * * @param {EventContext<object, any, any>} context - The Cloudflare Pages context object.
 * @returns {Promise<Response>} The proxied response from Google or an error response.
 */
export async function onRequest(context) {
    // console.log(context, {context});

    /** @type {Request} */
    const request = context.request;

    /** @type {URL|null} */
    const targetUrl = getTargetUrl(request.url);
    if (!targetUrl) {
        return new Response("Error: Missing Google Tag ID (?id=G-xxx)", {
            status: 400,
            headers: { "Content-Type": "text/plain" }
        });
    }

    /** re-fetch for original request
     * @type {RequestInit} 
     */
    const requestOptions = {
        method: request.method,
        headers: {
            "User-Agent": request.headers.get("User-Agent") || "",
            "Accept": request.headers.get("Accept") || "",
            "Accept-Language": request.headers.get("Accept-Language") || "",
        },
        // Required for POST requests (like GTM event collection)
        body: request.method === "POST" ? await request.blob() : null,
    };

    try {
        const googleResponse = await fetch(targetUrl.toString(), requestOptions);

        /** @type {Headers} */
        const responseHeaders = new Headers(googleResponse.headers);

        // Force First-Party Mode compatibility
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("X-Frame-Options", "SAMEORIGIN");

        // Performance: Cache the script at the edge for n seconds
        responseHeaders.set("Cache-Control", "public, max-age=3600");

        return new Response(googleResponse.body, {
            status: googleResponse.status,
            headers: responseHeaders,
        });
    } catch (err) {
        console.error(err);
        return new Response("Gateway for Google Tag, Error", { status: 502 });
    }
}



/**
 * Parses the incoming Request to extract the Google Tag Manager target URL.
 * * @param {string} link - The original incoming Request from the browser.
 * @returns {URL|null} The constructed Google URL or null if the ID is missing.
 */
function getTargetUrl(link) {
    try {
        const url = new URL(link);
        const queryId = url.searchParams.get("id");

        /** @type {string} */
        let tagId;
        if (queryId) {
            tagId = queryId;
        } else {
            tagId = url.pathname.split("/").pop();
            if (!tagId) return null;
        }

        /** @type {string} */
        const GOOGLE_TAG_CDN = '.fps.goog';
        return new URL(`https://${tagId}${GOOGLE_TAG_CDN}`);
    } catch (err) {
        console.warn(err);
        return null;
    }
}