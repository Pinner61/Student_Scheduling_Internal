import { site } from "../content/site";

const LIMITS = {
  first_name: 255,
  last_name: 255,
  email: 254,
  message: 5000,
} as const;

export function bindForm(root: HTMLElement, signal: AbortSignal): void {
  const form = root.querySelector<HTMLFormElement>("[data-propel-form]");
  if (!form) return;
  const status = form.querySelector<HTMLElement>("#form-status");
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      void submitForm(form, root, status, submit);
    },
    { signal },
  );
}

async function submitForm(
  form: HTMLFormElement,
  root: HTMLElement,
  status: HTMLElement | null,
  submit: HTMLButtonElement | null,
): Promise<void> {
  const fields = ["first_name", "last_name", "email", "message"] as const;
  let valid = true;
  fields.forEach((name) => {
    const input = form.elements.namedItem(name);
    if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLTextAreaElement)) return;
    const message = validateField(name, input.value);
    setFieldError(input, message);
    if (message) valid = false;
  });
  if (!valid) {
    writeStatus(status, "Check the highlighted fields.");
    const firstInvalid = form.querySelector<HTMLElement>("[aria-invalid='true']");
    firstInvalid?.focus();
    return;
  }

  const honeypot = form.elements.namedItem("company");
  if (honeypot instanceof HTMLInputElement && honeypot.value.trim()) {
    writeStatus(status, site.contact.failure);
    return;
  }

  const endpoint = root.dataset.formEndpoint?.trim() ?? "";
  if (!endpoint) {
    writeStatus(status, site.contact.unconfigured);
    return;
  }

  if (submit) {
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    submit.textContent = "Sending";
  }
  writeStatus(status, "Sending.");

  try {
    const body = new FormData(form);
    body.delete("company");
    const response = await fetch(endpoint, {
      method: "POST",
      body,
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    form.reset();
    fields.forEach((name) => {
      const input = form.elements.namedItem(name);
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) setFieldError(input, "");
    });
    writeStatus(status, site.contact.success);
  } catch {
    writeStatus(status, site.contact.failure);
  } finally {
    if (submit) {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      submit.textContent = "Submit";
    }
  }
}

function validateField(name: keyof typeof LIMITS, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "This field is required.";
  if (trimmed.length > LIMITS[name]) return `Use ${LIMITS[name]} characters or fewer.`;
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address.";
  return "";
}

function setFieldError(input: HTMLInputElement | HTMLTextAreaElement, message: string): void {
  const error = input.parentElement?.querySelector<HTMLElement>(".field-error");
  if (!error) return;
  if (message) {
    error.hidden = false;
    error.textContent = message;
    input.setAttribute("aria-invalid", "true");
  } else {
    error.hidden = true;
    error.textContent = "";
    input.removeAttribute("aria-invalid");
  }
}

function writeStatus(status: HTMLElement | null, message: string): void {
  if (status) status.textContent = message;
}
