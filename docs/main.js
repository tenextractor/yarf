function main() {
    const params = new URLSearchParams(window.location.search);
    let url = '';
    if (params.has('url')) {
        url = params.get('url');
    } else {
        window.location.replace('https://github.com/telextractor/yarf');
        return;
    }
    if (url[0] !== '/') {
        url = '/' + url;
    }

    const urlObj = splitParams(url);
    let params2 = new URLSearchParams(urlObj.params);
    params2.set('raw_json', '1');
    const reqUrl = urlObj.path + '.json?' + params2.toString();

    const commentRgx = new RegExp("^\/r\/.+\/comments\/.+");
    const postRgx = new RegExp("^\/r\/.+\/comments\/.+");
    const subRgx = new RegExp("^\/r\/.+\/?.*") //this matches posts too, which is why it has to be below the post regex in the if else order
    const uRgx = new RegExp("^\/u\/.+")
    const userRgx = new RegExp("^\/user\/.+")
    if (postRgx.test(url)) {
        getJson(url).then(data => handlePostPage(data));
    } else if (subRgx.test(url)) {
        getJson(url).then(data => handleSub(data, url));
    } else if (uRgx.test(url)) {
        getJson('/user' + url.slice(2)).then(data => handleUser(data, url));
    } else if (userRgx.test(url)) {
        getJson(url).then(data => handleUser(data, url));
    }
}

function splitParams(url) {
    const questionMarkIndex = url.indexOf('?');
    let path = url;
    let params = '';
    if (questionMarkIndex > -1) {
        path = url.slice(0, questionMarkIndex);
        params = url.slice(questionMarkIndex + 1);
    }
    return {
        'path': path,
        'params': params
    };
}

function getJson(url) {
    const urlObj = splitParams(url);
    const params2 = new URLSearchParams(urlObj.params);
    params2.set('raw_json', '1');
    url = urlObj.path + '.json?' + params2.toString();
    return fetch('https://www.reddit.com' + url).then(response => {return response.json()}).catch(err => {document.body.appendChild(document.createTextNode('Error'))});
}

function handlePostPage(data) {
    const postInfo = data[0]['data']['children'][0]['data'];
    let mainElement = makeElement('main', document.body, undefined, undefined, 'center');
    handlePost(postInfo, mainElement);
    const comments = data[1]['data']['children'];
    const commentsDiv = makeDiv(mainElement, 'comments');
    makeElement('p', commentsDiv, undefined, 'Comments', undefined);
    handleComments(data[1], commentsDiv, postInfo.permalink, postInfo.author);
}

function handleSub(data, url) {
    const mainElement = makeElement('main', document.body, undefined, undefined, 'center');
    handleListing(data.data.children, url, mainElement);
}

function handleUser(data, url) {
    const mainElement = makeElement('main', document.body, undefined, undefined, 'center');
    const user = data.data.children[0].data.author;
    const infoBox = makeDiv(mainElement, 'infoBox text-center space pad');
    getJson('/user/' + user + '/about').then(aboutData => {
        makeElement('b', infoBox, undefined, 'u/' + user + ' · ' + aboutData.data.total_karma + ' karma · created at ' + getTimestamp(aboutData.data.created_utc), undefined);
    });
    handleListing(data.data.children, url, mainElement);
}

function handleListing(listing, url, mainElement) {
    listing.forEach(post => {
        if (post.kind === 't3') {
            if (post.data.over_18) {
                const nsfwPost = postStructure(mainElement, 'post nsfw space', '', 'NSFW post', '?url=' + post.data.permalink, '');
                nsfwPost.right.children[1].children[0].setAttribute('class', 'nsfw');
            } else handlePost(post.data, mainElement);
        } else if (post.kind === 't1') {
            handleComment(post.data, mainElement);
        }
    });
    const urlObj = splitParams(url);
    let paramBefore = new URLSearchParams(urlObj.params);
    if (paramBefore.has('before') || paramBefore.has('after')) {
        paramBefore.delete('after');
        paramBefore.set('before', listing[0].data.name);
    }
    let paramAfter = new URLSearchParams(urlObj.params);
    paramAfter.delete('before');
    paramAfter.set('after', listing[listing.length-1].data.name);

    makeLink(mainElement, '< Previous', '?url=' + urlObj.path + '?' + paramBefore.toString());
    mainElement.appendChild(document.createTextNode(' '));
    makeLink(mainElement, 'Next >', '?url=' + urlObj.path + '?' + paramAfter.toString());
}

function handlePost(postInfo, mainElement) {
    const post = postStructure(mainElement, 'post border space', postInfo.score, postInfo.title, '?url=' + postInfo.permalink, postInfo.selftext_html);
    makeLink(post.header, postInfo.subreddit_name_prefixed, '?url=/' + postInfo.subreddit_name_prefixed);
    post.header.appendChild(document.createTextNode(' · '));
    makeLink(post.header, postInfo.author, '?url=/user/' + postInfo.author);
    post.header.appendChild(document.createTextNode(' · ' + getTimestamp(postInfo.created_utc)));
    if (postInfo.post_hint === 'link' || postInfo.post_hint === 'rich:video') {
        const link = makeLink(post.right, postInfo.url, postInfo.url);
        link.setAttribute('class', 'space')
    }
    handleMedia(postInfo, post.right);
    const footer = makeElement('div', post.right, undefined, postInfo.num_comments + ' comments · ', undefined);
    makeLink(footer, 'share', 'https://www.reddit.com' + postInfo.permalink);
}

function handleMedia(postInfo, postContent) {
    if (postInfo.post_hint === 'image') {
        makeImage(postContent, postInfo.preview.images[0].source.url);
    }
    if (postInfo.is_gallery) {
        postInfo.gallery_data.items.forEach(item => {
            const media = postInfo.media_metadata[item.media_id];
            if (media.m === 'image/gif') {
                makeImage(postContent, media.gif);
            } else {
                makeImage(postContent, media.s.u);
            }
        });
    }
    if (postInfo.post_hint === 'hosted:video') {
        const video = makeElement('video', postContent, undefined, undefined, 'media center space');
        video.setAttribute('controls', '')
        const source = makeElement('source', video, undefined, undefined, undefined);
        source.setAttribute('src', postInfo.secure_media.reddit_video.fallback_url);
    }
}

function handleComments(listing, parent, postLink, op) {
    listing.data.children.forEach(comment => {
        if (comment.kind === 'more') {
            const commentFull = makeDiv(parent, 'comment space');
            makeLink(commentFull, '> more replies', '?url=' + postLink + parent.parentNode.parentNode.id + '/');
        } else {
            const commentFull = postStructure(parent, 'comment space', comment.data.score, undefined, undefined, comment.data.body_html);
            commentFull.post.setAttribute('id', comment.data.id);
            if (comment.data.author === op) {
                const bold = makeElement('b', commentFull.header, undefined, undefined, undefined);
                makeLink(bold, comment.data.author, '?url=/user/' + comment.data.author);
            } else {
                makeLink(commentFull.header, comment.data.author, '?url=/user/' + comment.data.author);
            }
            commentFull.header.appendChild(document.createTextNode(' · '));
            makeLink(commentFull.header, getTimestamp(comment.data.created_utc), '?url=' + comment.data.permalink);
            if (comment.data.replies) {
                const commentReplies = makeDiv(commentFull.right, 'replies');
                handleComments(comment.data.replies, commentReplies, postLink, op);
            }
        }
    });
}

function handleComment(data, mainElement) {
    const comment = postStructure(mainElement, 'comment space', data.score, undefined, undefined, data.body_html);
    makeLink(comment.header, data.subreddit_name_prefixed + ' (comment)', '?url='+ data.permalink);
    comment.header.appendChild(document.createTextNode(' · '));
    makeLink(comment.header, data.author, '?url=/user/' + data.author);
    comment.header.appendChild(document.createTextNode(' · ' + getTimestamp(data.created_utc)));
}

function postStructure(parent, clas, leftText, titleText, titleLink, textHtml) {
    const full = makeDiv(parent, clas);
    const left = makeElement('div', full, undefined, leftText, 'left');
    const right = makeDiv(full, 'right');
    const header = makeDiv(right, 'header');
    if (titleText) {
        const title = makeElement('b', right, undefined, undefined, 'title space');
        makeLink(title, titleText, titleLink);
    }
    const text = makeDiv(right, 'text');
    text.innerHTML = textHtml;

    return {
        'post': full,
        'right': right,
        'header': header
    };
}

function getTimestamp(unixtime) {
    if (unixtime) {
        return new Date(unixtime * 1000).toISOString().slice(0, 16) + 'Z';
    } else return '?';
}

function makeDiv(parent, clas) {
    return makeElement('div', parent, undefined, undefined, clas);
}

function makeImage(parent, src) {
    const img = makeElement('img', parent, undefined, undefined, 'media space');
    img.setAttribute('src', src);
    return img;
}

function makeLink(parent, text, href) {
    const link = makeElement('a', parent, undefined, text, undefined);
    link.setAttribute('href', href);
    return link;
}

function makeElement(kind, parent, id, text, clas) {
    const element = document.createElement(kind);
    if (id) {
        element.setAttribute('id', id);
    }
    if (clas) {
        element.setAttribute('class', clas);
    }
    if (text) {
        element.appendChild(document.createTextNode(text));
    }
    parent.appendChild(element);
    return element;
}

main();
