import { getRandomBytes } from "expo-random";

// Ensure crypto.getRandomValues exists so that uuid and similar libs work on Expo Go.
const applyCryptoPolyfill = () => {
  if (typeof globalThis.crypto !== "object") {
    globalThis.crypto = {};
  }

  if (typeof globalThis.crypto.getRandomValues === "function") {
    return;
  }

  globalThis.crypto.getRandomValues = (typedArray) => {
    if (
      !typedArray ||
      typeof typedArray.length !== "number" ||
      typeof typedArray.byteLength !== "number"
    ) {
      throw new TypeError("Expected an array buffer view");
    }

    const randomBytes = getRandomBytes(typedArray.byteLength);
    const bytesView = new Uint8Array(
      typedArray.buffer,
      typedArray.byteOffset,
      typedArray.byteLength
    );

    bytesView.set(randomBytes);
    return typedArray;
  };
};

applyCryptoPolyfill();
