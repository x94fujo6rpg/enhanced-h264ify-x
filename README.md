# About
enhanced-h264ify is a fork of well-known h264ify extension for Firefox/Chrome which blocks VP8/VP9 codecs on YouTube, so that you can use H264 only. This may be useful because there are lots of devices on the market which support H264 hardware decoding and do not support VP8/VP9.

This extension has new features such as manual blocking of H264, VP8, VP9, AV1, Opus, AAC codecs and 60fps video. By default it blocks everything but H264 and 60fps video.
It works only on YouTube.

# Installation
* Install for Chrome:  
download [`enhanced-h264ify-x.crx`](https://github.com/x94fujo6rpg/enhanced-h264ify-x/raw/refs/heads/master/pkg/enhanced-h264ify-x.crx) and drag it into chrome

* Install for Firefox:  
download & load [`enhanced-h264ify-x firefox.zip`](https://github.com/x94fujo6rpg/enhanced-h264ify-x/raw/refs/heads/master/pkg/enhanced-h264ify-x%20firefox.zip) in `about:debugging#/runtime/this-firefox`


# Changelog

2.2.1.5
* improved performance (only extract data once per video)

2.2.1.4
* abort when only 1 video/audio codec available
* stop when only 1 video/audio codec left

2.2.1.3
* switch to service worker

fork
* fix & auto adapt to all codec
