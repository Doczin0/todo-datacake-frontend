import { format, parseISO } from "date-fns";

const ISO_FORMAT = "yyyy-MM-dd";

const openWebDatePicker = (initialDate = null) =>
  new Promise((resolve) => {
    const doc = typeof globalThis !== "undefined" ? globalThis.document : undefined;
    if (!doc) {
      resolve(null);
      return;
    }

    const input = doc.createElement("input");
    input.type = "date";
    input.value = initialDate ? format(initialDate, ISO_FORMAT) : "";
    input.style.position = "absolute";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";

    const cleanup = () => {
      input.removeEventListener("change", handleChange);
      input.removeEventListener("blur", handleBlur);
      if (input.parentNode && input.parentNode.removeChild) {
        input.parentNode.removeChild(input);
      }
    };

    const handleChange = (event) => {
      const value = event.target.value;
      cleanup();
      if (!value) {
        resolve(null);
        return;
      }
      resolve(parseISO(value));
    };

    const handleBlur = () => {
      cleanup();
      resolve(null);
    };

    input.addEventListener("change", handleChange, { once: true });
    input.addEventListener("blur", handleBlur, { once: true });

    doc.body.appendChild(input);
    input.focus();

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  });

export default openWebDatePicker;
