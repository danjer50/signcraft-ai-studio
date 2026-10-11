import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount rendered trees between tests. Vitest globals are off, so RTL cannot do this itself.
afterEach(() => {
  cleanup();
});
