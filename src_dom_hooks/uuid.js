module.exports = function uuid (useUnderscores = false) {
  // Get 16 random bytes
  const rnds = crypto.getRandomValues(new Uint8Array(16));

  // RFC 4122: set version (4) and variant (10xxxxxx)
  rnds[6] = (rnds[6] & 0x0f) | 0x40; // version 4
  rnds[8] = (rnds[8] & 0x3f) | 0x80; // variant 10xx

  // Precompute hex strings for 0..255
  const hex = [];
  for (let i = 0; i < 256; i++) {
    hex[i] = (i + 0x100).toString(16).substring(1);
  }

  const sep = useUnderscores ? "_" : "-";

  // Assemble xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return (
    hex[rnds[0]] +
    hex[rnds[1]] +
    hex[rnds[2]] +
    hex[rnds[3]] + sep +
    hex[rnds[4]] +
    hex[rnds[5]] + sep +
    hex[rnds[6]] +
    hex[rnds[7]] + sep +
    hex[rnds[8]] +
    hex[rnds[9]] + sep +
    hex[rnds[10]] +
    hex[rnds[11]] +
    hex[rnds[12]] +
    hex[rnds[13]] +
    hex[rnds[14]] +
    hex[rnds[15]]
  );
}
