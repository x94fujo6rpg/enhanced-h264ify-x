// Saves options to chrome.storage
function save_options() {
  var block_60fps = document.getElementById('block_60fps').checked;
  var block_h264 = document.getElementById('block_h264').checked;
  var block_vp8 = document.getElementById('block_vp8').checked;
  var block_vp9 = document.getElementById('block_vp9').checked;
  var block_av1 = document.getElementById('block_av1').checked;
  var block_opus = document.getElementById('block_opus').checked;
  var block_mp4a = document.getElementById('block_mp4a').checked;
  // LN stands for Loudness Normalization
  var disable_LN = document.getElementById('disable_LN').checked;
  // -x
  var max_res = document.getElementById("max_res").checked;
  var res_setting = document.querySelector(`input[name="res_setting"]:checked`).value;
  chrome.storage.local.set({
    block_60fps: block_60fps,
    block_h264: block_h264,
    block_vp8: block_vp8,
    block_vp9: block_vp9,
    block_av1: block_av1,
    block_opus: block_opus,
    block_mp4a: block_mp4a,
    disable_LN: disable_LN,
    max_res: max_res,
    res_setting: res_setting
  });
}

// Restores checkbox state using the options stored in chrome.storage.
function restore_options() {
  // Default values
  chrome.storage.local.get({
    block_60fps: false,
    block_h264: false,
    block_vp8: true,
    block_vp9: true,
    block_av1: true,
    block_opus: false,
    block_mp4a: false,
    disable_LN: false,
    max_res: true,
    res_setting: "1080"
  }, function(options) {
    document.getElementById('block_60fps').checked = options.block_60fps;
    document.getElementById('block_h264').checked = options.block_h264;
    document.getElementById('block_vp8').checked = options.block_vp8;
    document.getElementById('block_vp9').checked = options.block_vp9;
    document.getElementById('block_av1').checked = options.block_av1;
    document.getElementById('block_opus').checked = options.block_opus;
    document.getElementById('block_mp4a').checked = options.block_mp4a;
    document.getElementById('disable_LN').checked = options.disable_LN;
    document.getElementById('max_res').checked = options.max_res;
    let res_setting = options.res_setting;
    if (res_setting !=="max" && parseInt(res_setting, 10) == NaN) res_setting = "1080";
    document.querySelector(`input[name="res_setting"][value="${res_setting}"]`).checked = true;
  });
}

// Restore saved options when extension is loaded
document.addEventListener('DOMContentLoaded', restore_options);

// Save options when checkboxes are clicked
var checkboxes = document.querySelectorAll(`[type="checkbox"],[type="radio"]`);
for (var i = 0; i < checkboxes.length; i++) {
  checkboxes[i].addEventListener('click', save_options)
}

// l10n
for (let element of document.querySelectorAll('[data-l10n-id]')) {
  element.innerHTML = chrome.i18n.getMessage(element.dataset.l10nId);
}
