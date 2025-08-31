/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 alextrv
 * Copyright (c) 2015 erkserkserks
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function () {
    let last_video_id = false;
    let last_video_disallowed_types = false;

    function override() {
        // Override video element canPlayType() function
        var videoElem = document.createElement("video");
        var origCanPlayType = videoElem.canPlayType.bind(videoElem);
        videoElem.__proto__.canPlayType = makeModifiedTypeChecker(origCanPlayType);

        // Override media source extension isTypeSupported() function
        var mse = window.MediaSource;
        // Check for MSE support before use
        if (mse === undefined) return;
        var origIsTypeSupported = mse.isTypeSupported.bind(mse);
        mse.isTypeSupported = makeModifiedTypeChecker(origIsTypeSupported);
    }

    // return a custom MIME type checker that can defer to the original function
    function makeModifiedTypeChecker(origChecker) {
        // Check if a video type is allowed
        return function (type) {
            let original_type = type;
            let disallowed_types, vid;
            if (type === undefined) {
                return false;
            } else {
                type = type.match(/.+;\s*codecs="(.+)"/);
                if (type) {
                    type = type[1];
                } else {
                    return false;
                }
            }
            if (!window.location.href.match(/\/shorts\//)) {
                vid = new URL(window.location.href).searchParams.get("v");
                if (!vid) {
                    // https://www.youtube.com/embed/xxxxxx
                    vid = window.location.href.match(/\/embed\/(.+)/);
                    if (vid) {
                        return origChecker(original_type);
                    }
                }
                // only do new extract when current video id is different
                if (vid == last_video_id) {
                    // get last extract result if video id is the same
                    disallowed_types = last_video_disallowed_types;
                } else {
                    // extract & save new result
                    if (!ytInitialPlayerResponse) return origChecker(original_type);
                    disallowed_types = new Set(get_disallowed_list(vid));
                    last_video_disallowed_types = disallowed_types;
                }
            } else {
                if (!ytInitialPlayerResponse) return origChecker(original_type);
                disallowed_types = new Set(get_disallowed_list("shorts"));
            }

            // If video type is in disallowed_types, say we don't support them
            if (disallowed_types.has(type)) {
                return false;
            }

            if (localStorage["enhanced-h264ify-block_60fps"] === "true") {
                let match = /framerate=(\d+)/.exec(original_type);
                if (match && match[1] > 30) {
                    return false;
                }
            }

            // Otherwise, ask the browser
            return origChecker(original_type);
        };
    }

    override();

    function get_disallowed_list(_vid) {
        let format_list = new Set();
        let codecs_data;

        for (let data of ytInitialPlayerResponse.streamingData.adaptiveFormats) {
            let { mimeType } = data;
            let codecs = mimeType.match(/.+;\s*codecs="(.+)"/);
            if (codecs) format_list.add(codecs[1]);
        }
        format_list = [...format_list].join("\n");

        codecs_data = {
            avc: format_list.match(/^avc\d+.*/gm),
            av1: format_list.match(/^av\d+.*/gm),
            vp8: format_list.match(/^vp8.*/gm),
            vp9: format_list.match(/^vp9.*/gm),
            opus: format_list.match(/^opus/gm),
            mp4a: format_list.match(/^mp4a/gm),
        };

        // remove empty list & count available codec
        let available_video_codec = 0;
        let available_audio_codec = 0;
        for (let [key, arr] of Object.entries(codecs_data)) {
            if (!arr) {
                delete codecs_data[key];
            } else if (["opus", "mp4a"].some((_key) => key == _key)) {
                available_audio_codec++;
            } else {
                available_video_codec++;
            }
        }

        // save current video id & reset disallowed_types
        last_video_id = _vid;
        last_video_disallowed_types = false;

        let disallowed_types = [];

        // skip if only 1 codec available
        if (available_video_codec > 1) {
            let codecs_map = {
                avc: "h264",
                av1: "av1",
                vp8: "vp8",
                vp9: "vp9",
            };
            for (let [_key, _name] of Object.entries(codecs_map)) {
                if (localStorage[`enhanced-h264ify-block_${_name}`] === "true") {
                    if (codecs_data[_key]) {
                        disallowed_types.push(...codecs_data[_key]);
                        available_video_codec--;
                    }
                    // abort when only 1 codec left
                    if (available_video_codec <= 1) break;
                }
            }
        }

        // skip if only 1 codec available
        if (available_audio_codec > 1) {
            let codecs_map = {
                opus: "opus",
                mp4a: "mp4a",
            };
            for (let [_key, _name] of Object.entries(codecs_map)) {
                if (localStorage[`enhanced-h264ify-block_${_name}`] === "true") {
                    if (codecs_data[_key]) {
                        disallowed_types.push(...codecs_data[_key]);
                        available_audio_codec--;
                    }
                    // abort when only 1 codec left
                    if (available_audio_codec <= 1) break;
                }
            }
        }

        if (_vid != "shorts") {
            console.log(`new video id:[${_vid}], codecs_data:`, codecs_data);
            console.log("disallowed_types", disallowed_types);
        }

        return disallowed_types;
    }
})();
