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

            // https://www.youtube.com/watch?v=xxxxx
            vid = new URL(window.location.href).searchParams.get("v");
            if (!vid) {
                // https://www.youtube.com//shorts/xxxxx
                // https://www.youtube.com/embed/xxxxxx
                vid = window.location.href.match(/\/shorts\/([^?]+)/) || window.location.href.match(/\/embed\/([^?]+)/);
                if (vid) {
                    vid = vid[1];
                } else {
                    return origChecker(original_type);
                }
            }

            // only do new extract when current video id is different
            let last_video_id = sessionData.get_last_id();
            let last_video_disallowed_types = sessionData.get_last_disallowed();
            // temp_value expired in few sec, so it auto reset & retry when reload
            let temp_value = sessionData.get_temp_value();
            if (vid == last_video_id && last_video_disallowed_types && temp_value) {
                // get last extract result if video id is the same
                disallowed_types = last_video_disallowed_types;
            } else {
                console.log(`vid change detected. new:[${vid}] old:[${last_video_id}]`);
                // extract & save new result
                disallowed_types = get_disallowed_list(vid);
                if (!disallowed_types) return origChecker(original_type);
                sessionData.set_last_disallowed(disallowed_types);
            }

            if (!disallowed_types || disallowed_types.length < 1) return origChecker(original_type);

            disallowed_types = new Set(disallowed_types);

            // If video type is in disallowed_types, say we don't support them
            // sneaky unlisted format workaround
            let reg_match_codec = codecs_util.get_reg_match(type);
            if (disallowed_types.has(reg_match_codec)) return false;

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

    const sessionData = {
        id: {
            last_id: "enhanced-h264ify-last_id",
            last_disallowed: "enhanced-h264ify-last_disallowed",
            temp_value: "enhanced-h264ify-temp_value",
        },
        set_last_id(id = "") {
            if (typeof id === "string" && length < 15) {
                sessionStorage.setItem(this.id.last_id, id);
            } else {
                sessionStorage.removeItem(this.id.last_id);
            }
        },
        set_last_disallowed(list = []) {
            if (list instanceof Array) {
                sessionStorage.setItem(this.id.last_disallowed, JSON.stringify(list));
            } else {
                sessionStorage.removeItem(this.id.last_disallowed);
            }
        },
        set_temp_value() {
            sessionStorage.setItem(this.id.temp_value, "auto_expired");
            setTimeout(() => sessionStorage.removeItem(this.id.temp_value), 1000);
        },
        get_last_id() {
            let id = sessionStorage.getItem(this.id.last_id);
            return typeof id === "string" && id.length > 0 ? id : false;
        },
        get_last_disallowed() {
            let list = JSON.parse(sessionStorage.getItem(this.id.last_disallowed));
            return list instanceof Array ? list : false;
        },
        get_temp_value() {
            return sessionStorage.getItem(this.id.temp_value);
        },
    };
    const codecs_util = {
        video_list: ["avc", "av1", "vp8", "vp9"],
        audio_list: ["opus", "mp4a"],
        all_format: ["avc", "av1", "vp8", "vp9", "opus", "mp4a"],
        // map to codec config name
        video_map: {
            avc: "h264",
            av1: "av1",
            vp8: "vp8",
            vp9: "vp9",
        },
        audio_map: {
            opus: "opus",
            mp4a: "mp4a",
        },
        reg: {
            avc: /avc\d+/,
            av1: /av\d+/,
            vp8: /vp8/,
            vp9: /vp9|vp09/,
            opus: /opus/,
            mp4a: /mp4a/,
        },
        get_reg_match(string = "") {
            for (let [key, reg] of Object.entries(this.reg)) {
                if (string.match(reg)) return key;
            }
            console.log(`no reg match for [${string}]`);
            return false;
        },
        is_audio(string = "") {
            return this.audio_list.some((_key) => _key == string);
        },
    };

    function get_video_info_sync(vid) {
        if (!vid) {
            return false;
        }

        let request = new XMLHttpRequest();
        request.open("POST", "https://www.youtube.com/youtubei/v1/player", false);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(
            JSON.stringify({
                context: {
                    client: {
                        clientName: "WEB",
                        clientVersion: "2.20230327.07.00",
                    },
                },
                videoId: vid,
            })
        );

        if (request.status == 200) {
            return JSON.parse(request.responseText);
        } else {
            return false;
        }
    }

    function get_disallowed_list(_vid) {
        let format_data = get_video_info_sync(_vid);
        let allowed_types = [];
        if (
            !format_data ||
            !format_data.streamingData ||
            !format_data.streamingData.adaptiveFormats ||
            !format_data.playabilityStatus ||
            format_data.playabilityStatus.status != "OK" // not playable video like offline live stream
        ) {
            return false;
        }
        format_data = format_data.streamingData.adaptiveFormats;

        // extract codecs & resolution info
        let resolution_data = codecs_util.video_list.reduce((acc, current) => ({ ...acc, [current]: 0 }), {}),
            codecs_data = codecs_util.all_format.reduce((acc, current) => ({ ...acc, [current]: new Set() }), {}),
            max_resolution = 0,
            table = []; // for log
        for (let data of format_data) {
            let { mimeType, width, height, qualityLabel, bitrate } = data;
            let codecs = mimeType.match(/.+;\s*codecs="(.+)"/);
            if (codecs) {
                let codec_key;
                codecs = codecs[1];
                codec_key = codecs_util.get_reg_match(codecs);
                codecs_data[codec_key].add(codecs);
                allowed_types.push(codecs);
                // video resolution info
                if (height) {
                    if (height > max_resolution) max_resolution = height;
                    if (height > resolution_data[codec_key]) resolution_data[codec_key] = height;
                    table.push({ codec_key, codecs, mimeType, width, height, qualityLabel, bitrate });
                }
            }
        }
        console.table(table);

        // check resolution. discard if it doesn't support max_resolution.
        if (localStorage["enhanced-h264ify-max_res"] === "true") {
            // override if not set to max
            if (localStorage["enhanced-h264ify-res_setting"] !== "max") {
                max_resolution = parseInt(localStorage["enhanced-h264ify-res_setting"], 10);
            }
            console.log("max_resolution", max_resolution, "resolution_data", resolution_data);
            for (let [key, height] of Object.entries(resolution_data)) {
                if (max_resolution > height) {
                    if (height > 0)
                        console.log(`${key} lacks ${max_resolution}p info. discard ${key} from exclusion list.`);
                    delete codecs_data[key];
                }
            }
        }

        // remove empty list & count available codec
        let available_video_codec = 0;
        let available_audio_codec = 0;
        for (let [key, set] of Object.entries(codecs_data)) {
            if (set.size == 0) {
                delete codecs_data[key];
            } else if (codecs_util.is_audio(key)) {
                codecs_data[key] = [...set.add(key)]; // add default codec name to remain one
                available_audio_codec++;
            } else {
                codecs_data[key] = [...set.add(key)]; // add default codec name to remain one
                available_video_codec++;
            }
        }
        console.log(`available_video_codec:${available_video_codec}, available_audio_codec:${available_audio_codec}`);

        // save current video id & reset disallowed_types
        sessionData.set_last_id(_vid);
        sessionData.set_last_disallowed(false);
        sessionData.set_temp_value();

        let disallowed_types = [];

        // skip if only 1 codec available
        if (available_video_codec > 1) {
            for (let [_key, _name] of Object.entries(codecs_util.video_map)) {
                if (localStorage[`enhanced-h264ify-block_${_name}`] === "true") {
                    if (codecs_data[_key]) {
                        console.log(`blocking ${_key}`);
                        disallowed_types.push(...codecs_data[_key]);
                        available_video_codec--;
                    }
                    // abort when only 1 codec left
                    if (available_video_codec <= 1) {
                        console.log(`no video codec left. skip`);
                        break;
                    }
                }
            }
        } else {
            console.log(`only 1 video codec available. skip`);
        }

        // skip if only 1 codec available
        if (available_audio_codec > 1) {
            for (let [_key, _name] of Object.entries(codecs_util.audio_map)) {
                if (localStorage[`enhanced-h264ify-block_${_name}`] === "true") {
                    if (codecs_data[_key]) {
                        console.log(`blocking ${_key}`);
                        disallowed_types.push(...codecs_data[_key]);
                        available_audio_codec--;
                    }
                    // abort when only 1 codec left
                    if (available_audio_codec <= 1) {
                        console.log(`no audio codec left. skip`);
                        break;
                    }
                }
            }
        } else {
            console.log(`only 1 audio codec available. skip`);
        }

        allowed_types = [...new Set(allowed_types)];
        allowed_types = allowed_types.filter((c) => !disallowed_types.find((_c) => _c == c));

        console.log(`new video id:[${_vid}], codecs_data:`, codecs_data);
        console.log("disallowed_types", disallowed_types);
        console.log("allowed_types", allowed_types);

        return disallowed_types;
    }
})();
