declare module "unzipper/lib/parseOne" {
  import type { Duplex } from "node:stream";

  export default function parseOne(match?: RegExp | string, opts?: unknown): Duplex;
}

