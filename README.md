# About
enhanced-h264ify is a fork of well-known h264ify extension for Firefox/Chrome which blocks VP8/VP9 codecs on YouTube, so that you can use H264 only. This may be useful because there are lots of devices on the market which support H264 hardware decoding and do not support VP8/VP9.

This extension has new features such as manual blocking of H264, VP8, VP9, AV1, Opus, AAC codecs and 60fps video. By default it blocks everything but H264 and 60fps video.
It works only on YouTube.

# Installation
* Install for Chrome:  
download [`enhanced-h264ify-x.zip`](https://github.com/x94fujo6rpg/enhanced-h264ify-x/raw/refs/heads/master/pkg/enhanced-h264ify-x.zip) and drag it into `chrome://extensions/`  
  
* Install for Edge:  
download [`enhanced-h264ify-x.zip`](https://github.com/x94fujo6rpg/enhanced-h264ify-x/raw/refs/heads/master/pkg/enhanced-h264ify-x.zip) and drag it into `edge://extensions/`  
  
* Install for Firefox:  
install it on [AMO enhanced-h264ify-x](https://addons.mozilla.org/firefox/addon/enhanced-h264ify-x/) (possible older version because it requires review)  
download & load [`enhanced-h264ify-x firefox.zip`](https://github.com/x94fujo6rpg/enhanced-h264ify-x/raw/refs/heads/master/pkg/enhanced-h264ify-x%20firefox.zip) in `about:debugging#/runtime/this-firefox`  
you need to reinstall it every time you restart firefox  
because firefox hate dev  
add-ons won't work properly unless it's verified on AMO  
even though they have fewer staff to do the review process  
make it take 1 week to few month  
there's nothing I can do  

# Improved

pull video info & get all available codecs  
auto stop block video codec when only 1 video codec available/left (prevent playback error)  
auto stop block audio codec when only 1 audio codec available/left (prevent playback error)  

* Optional  
don't block if the codec's resolution(360~1080 or highest) is unavailable  

\*youtube don't like you only allowing/force av1  

# Changelog

2.2.1.13
* language support: `zh_TW, zh_CN`
* new option: 
  * `Don't block codec If max resolution is lower than:` 
    * Highest available(Adaptive)
    * 1080p
    * 720p
    * 480p
    * 360p

2.2.1.12
* ~~auto~~ stop when the specified codec does not have max resolution that video supports

2.2.1.9
* sneaky unlisted format workaround  
  like:
  ```
  vp09.02.51.10.01.09.16.09.00
  vp09.02.51.10.01.09.99.99.00
  vp09.00.51.08.01.01.01.01.00
  ...
  ```

2.2.1.8
* fix embed

2.2.1.7
* ~~bypass embed until fix~~

2.2.1.6
* fix shorts

2.2.1.5
* improved performance (only extract data once per video)

2.2.1.4
* abort when only 1 video/audio codec available
* stop when only 1 video/audio codec left

2.2.1.3
* switch to service worker

fork
* fix & auto adapt to all codec
