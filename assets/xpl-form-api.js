"use strict";

class XplFormContainer {
  static Instance;
  CachedForms = {};
  formsServiceURL = "";

  constructor(formServiceURL) {
    if (XplFormContainer.Instance) return XplFormContainer.Instance;
    this.formsServiceURL = formServiceURL;
    XplFormContainer.Instance = this;
  }

  get(formUuid) {
    return this.CachedForms[formUuid] || null;
  }

  async load(uuid) {
    if (this.CachedForms[uuid]) return this.CachedForms[uuid];
    const formURL = `${this.formsServiceURL}/parameters?uuid=${uuid}`;
    const response = await fetch(formURL);
    const { parameters } = await response.json();
    this.CachedForms[uuid] = parameters;
    return parameters;
  }
}

if (!window.XplFormContainer) window.XplFormContainer = XplFormContainer;

class XplFormAPI {
  static PageUrlParams = new URLSearchParams(new URL(window.location).href);
  FormsServiceURL = "";
  FormActionURL = null;
  // reference to the html Form Element
  FormElement = null;
  // reference to the html alert container
  AlertContainer = null;
  // Parsed form values
  FormParams = {};
  // Form configuration stored on server
  Form = null;

  constructor(formServiceUrl, formElement, formContainer) {
    this.FormElement = formElement;
    const { formParams, actionUrl, alertContainer } =
      XplFormAPI.parse(formElement);
    this.FormParams = formParams;
    this.FormsServiceURL = formServiceUrl;
    this.FormActionURL = actionUrl;
    this.AlertContainer = alertContainer;
    this.Form = formContainer.get(formParams.uuid);
    if (!this.Form)
      throw Error(
        "Form configuration has not been loaded, please load it: FormContainer.load(<uuid>)",
      );
  }

  static parse(formElement) {
    const form = new FormData(formElement);
    const actionUrl = formElement.getAttribute("action");
    const alertContainer = formElement.querySelector("#alert");
    return { formParams: Object.fromEntries(form), actionUrl, alertContainer };
  }

  static loadRecaptchaScript(recaptchaKey) {
    if (window.grecaptcha) return;
    const recaptchaScript = document.createElement("script");
    recaptchaScript.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaKey}`;
    document.head.appendChild(recaptchaScript);
  }

  static registerMultiselectInput(target) {
    const field = target
      .closest(`div.form-group.multi-select`)
      .querySelector("input[name]");
    const registeredValues = field.value ? field.value.split(",") : [];
    if (target.checked) registeredValues.push(target.value);
    else registeredValues.splice(registeredValues.indexOf(target.value), 1);
    field.value = registeredValues.join(",");
  }

  getUtmParam(fieldName) {
    let param = XplFormAPI.PageUrlParams.get(fieldName);
    if (!param) {
      const field = this.Form.fields.find((field) => field.id === fieldName);
      param = field?.options?.[0]?.url;
    }
    return param;
  }

  getRecaptchaKey() {
    const { template } = this.Form;
    return template.use_recaptcha ? template.recaptcha_key : null;
  }

  buildAutologinURL(payload) {
    const formsURL =
      new URL(this.FormsServiceURL).origin.replace("api", "forms") +
      "/assets/index.html";
    const autologinURL = new URL(formsURL);
    autologinURL.searchParams.set("autologinRequest", payload);
    return autologinURL.toString();
  }

  createLoader(anchor) {
    const loaderContainer = document.createElement("div");
    loaderContainer.className = "loader-container";
    const loaderContent = document.createElement("div");
    loaderContent.className = "loader-content";
    loaderContainer.appendChild(loaderContent);
    anchor.style.position = "relative";
    return {
      hide: () => anchor.removeChild(loaderContainer),
      show: () => anchor.appendChild(loaderContainer),
      setMessage: function (title, state = "loading") {
        loaderContent.innerHTML = "";
        const messageTitle = document.createElement("span");
        messageTitle.textContent = title;
        const statusIcon = document.createElement("div");
        statusIcon.classList.add("loader-status", state);
        loaderContent.appendChild(statusIcon);
        loaderContent.appendChild(messageTitle);
        return this;
      },
    };
  }

  createAlert(alertElement) {
    return {
      hide: () => (alertElement.style.display = "none"),
      show: () => (alertElement.style.display = "block"),
      setMessage: function (message, type) {
        alertElement.textContent = message;
        alertElement.classList.remove(["success", "error"]);
        alertElement.classList.add(type);
        return this;
      },
    };
  }

  performMtAutoLogin(redirectUrl, response, loader) {
    const { webhook_responses } = response.data;
    const webhook = webhook_responses.find(
      (webhook) =>
        webhook.task === "CREATE_USER" &&
        webhook.vendor === "MARIANATEK" &&
        webhook.response.status === 200 &&
        !webhook.response.data.message?.startsWith(
          "Skipping credit distribution",
        ),
    );
    if (webhook) {
      loader.setMessage("redirecting to Marianatek...");
      const { mt_subdomain, ephemeral_token, home_location, region_id } =
        webhook.response.data.data;
      const autologinPayload = JSON.stringify({
        mt_subdomain,
        ephemeral_token,
        redirect_url: redirectUrl,
        home_location,
        region_id,
      });
      window.location.assign(this.buildAutologinURL(autologinPayload));
      return true;
    }
    return false;
  }

  async submit(recaptchaResponse) {
    const loader = this.createLoader(this.FormElement.parentElement).setMessage(
      "Submitting your response...",
    );
    const { redirect, sync } = this.Form;
    const mtSync = sync.active && sync.vendor === "marianatek";
    const redirectUrl = redirect?.active ? redirect.url : null;
    if (mtSync) loader.setMessage("Taking you to book your first class...");

    // set all checkbox values to boolean
    [
      "opt_in_email",
      "opt_in_sms",
      "mt_terms_and_service",
      "mt_opt_in_email",
      "mt_opt_in_sms",
    ].forEach((attr) => {
      if (this.FormParams[attr]) this.FormParams[attr] = true;
    });
    // disable submit button
    const submitBtn = this.FormElement.querySelector("#bb_submit");
    if (!this.FormParams.email) return;
    submitBtn.setAttribute("disabled", true);
    const payload = {
      uuid: this.FormParams.uuid,
      response: this.FormParams,
    };
    ["utm_campaign", "utm_source", "utm_medium"].forEach(
      (utmField) => (payload.response[utmField] = this.getUtmParam(utmField)),
    );
    if (recaptchaResponse)
      payload.response.g_recaptcha_response = recaptchaResponse;
    const alert = this.createAlert(this.AlertContainer);
    try {
      loader.show();
      const response = await fetch(this.FormActionURL, {
        method: "POST",
        body: JSON.stringify(payload),
        contentType: "application/json",
      }).then(async (res) => ({ data: await res.json(), ok: res.ok }));
      if (!response.ok) throw new Error(response.data.message);
      // add a success alert
      //alert.setMessage("Your submission was successful!", "success").show();
      alert.setMessage("Your submission was successful!", "success").show();
      this.FormElement.reset();
      if (!redirectUrl) {
        loader.setMessage(redirect?.message, "success");
        return;
      }
      if (mtSync) {
        const autologinStatus = this.performMtAutoLogin(
          redirectUrl,
          response,
          loader,
        );
        if (autologinStatus) return;
      }
      window.location.assign(redirectUrl);
    } catch (err) {
      alert
        .setMessage(
          err.message ||
            "Error occured while saving your responses, please try again later",
          "error",
        )
        .show();
      loader.hide();
    } finally {
      submitBtn.removeAttribute("disabled");
    }
  }
}

window.XplFormAPI = XplFormAPI;