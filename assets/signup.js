/*
  Edge Within email signup (Kit, formerly ConvertKit)
  Used by /feed/ and the footer signup form on every page.

  ==================================================================
  Kit form: 10012918.
  To switch forms, change the number in KIT_FORM_ACTION below. That
  one line wires every signup form on the site.
  Kit fields used: email_address (required), fields[first_name].
  ==================================================================
*/
(function () {
  'use strict';

  var KIT_FORM_ACTION = 'https://app.kit.com/forms/10012918/subscriptions';

  var MESSAGES = {
    success: "Nearly there. Check your inbox to confirm your email.",
    notReady: "Thanks for that. Email updates are being switched on very soon, so please check back shortly. In the meantime, follow @edgewithinpodcast on Instagram for new episodes.",
    error: "Something went wrong there. Please check your email address and try again.",
    sending: "Signing you up..."
  };

  var isReady = KIT_FORM_ACTION.indexOf('KIT_FORM_ID') === -1;

  function setStatus(form, text, kind) {
    var el = form.querySelector('[data-signup-status]');
    if (!el) return;
    el.textContent = text;
    el.className = 'signup-status' + (kind ? ' is-' + kind : '');
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = busy;
      btn.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
  }

  function finish(form) {
    form.classList.add('is-done');
    setStatus(form, MESSAGES.success, 'success');
    var status = form.querySelector('[data-signup-status]');
    if (status) { status.setAttribute('tabindex', '-1'); status.focus(); }
  }

  // Normal (non-JS style) form post to Kit. Used if fetch is unavailable
  // or blocked, so the signup still goes through on Kit's own page.
  function nativeSubmit(form) {
    form.action = KIT_FORM_ACTION;
    form.method = 'post';
    HTMLFormElement.prototype.submit.call(form);
  }

  function init(form) {
    if (isReady) { form.action = KIT_FORM_ACTION; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: real people never see or fill this field.
      var hp = form.querySelector('[data-hp]');
      if (hp && hp.value) { finish(form); return; }

      if (!isReady) { setStatus(form, MESSAGES.notReady, 'info'); return; }

      var first = form.querySelector('[name="fields[first_name]"]');
      if (first) { first.value = first.value.trim(); }

      // The honeypot input has no name, so it is never sent to Kit.
      var data = new FormData(form);

      if (!window.fetch) { nativeSubmit(form); return; }

      setBusy(form, true);
      setStatus(form, MESSAGES.sending, '');

      fetch(KIT_FORM_ACTION, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (json) {
            return { ok: res.ok, json: json || {} };
          });
        })
        .then(function (r) {
          setBusy(form, false);
          var status = r.json.status;
          if (status === 'success' || (r.ok && !status)) {
            finish(form);
          } else if (status === 'failed' || !r.ok) {
            setStatus(form, MESSAGES.error, 'error');
          } else {
            // Anything unexpected (e.g. Kit wants an extra check): hand over to Kit's own page.
            nativeSubmit(form);
          }
        })
        .catch(function () {
          // Network or cross-origin problem: fall back to a normal form post.
          setBusy(form, false);
          nativeSubmit(form);
        });
    });
  }

  function start() {
    var forms = document.querySelectorAll('form[data-signup]');
    for (var i = 0; i < forms.length; i++) { init(forms[i]); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
