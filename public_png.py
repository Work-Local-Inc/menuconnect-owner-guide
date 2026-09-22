"""Fail-closed checks for every PNG copied into the public site.

Only image-essential PNG chunks are allowed. No ancillary metadata, including
EXIF, XMP, textual, colour-profile, timestamps, or private ancillary chunks.
"""
import binascii
from pathlib import Path
import struct
import zlib

SIGNATURE = b"\x89PNG\r\n\x1a\n"
ALLOWED = {b"IHDR", b"PLTE", b"tRNS", b"IDAT", b"IEND"}
DEPTHS = {0: (1, 2, 4, 8, 16), 2: (8, 16), 3: (1, 2, 4, 8),
          4: (8, 16), 6: (8, 16)}
CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}
MAX_RAW_BYTES = 100_000_000


def validate_png(data: bytes, name: str = "PNG") -> None:
    def fail(reason):
        raise ValueError(f"{name}: {reason}")

    if not data.startswith(SIGNATURE):
        fail("invalid PNG signature")
    pos = len(SIGNATURE)
    chunks = []
    compressed = bytearray()
    seen_idat = False
    seen_end = False
    width = height = depth = color = 0
    expected = rowbytes = chunks_palette_size = 0
    while pos < len(data):
        if len(data) - pos < 12:
            fail("truncated chunk")
        length = struct.unpack_from(">I", data, pos)[0]
        end = pos + 12 + length
        if end > len(data):
            fail("truncated chunk data")
        kind = data[pos + 4:pos + 8]
        body = data[pos + 4:end - 4]
        if binascii.crc32(body) & 0xffffffff != struct.unpack_from(">I", data, end - 4)[0]:
            fail("bad chunk CRC")
        payload = data[pos + 8:end - 4]
        if kind not in ALLOWED:
            fail(f"metadata or unsupported chunk {kind!r}")
        if seen_end or (not chunks and kind != b"IHDR"):
            fail("invalid chunk ordering")
        if kind == b"IHDR":
            if chunks or length != 13:
                fail("invalid IHDR")
            width, height, depth, color, compression, filtering, interlace = struct.unpack(">IIBBBBB", payload)
            if (not width or not height or depth not in DEPTHS.get(color, ()) or
                    compression != 0 or filtering != 0 or interlace != 0):
                fail("invalid or unsupported image format")
            rowbytes = (width * depth * CHANNELS[color] + 7) // 8
            expected = height * (rowbytes + 1)
            if expected > MAX_RAW_BYTES:
                fail("decoded PNG exceeds safety limit")
        elif kind == b"PLTE":
            if seen_idat or b"PLTE" in chunks or b"tRNS" in chunks or color in (0, 4) or length == 0 or length % 3 or length > 768:
                fail("invalid palette")
        elif kind == b"tRNS":
            if seen_idat or b"tRNS" in chunks or color not in (0, 2, 3):
                fail("invalid transparency chunk")
            if (color == 3 and (b"PLTE" not in chunks or not 0 < length <= chunks_palette_size)) or \
               (color == 0 and length != 2) or (color == 2 and length != 6):
                fail("invalid transparency payload")
        elif kind == b"IDAT":
            if color == 3 and b"PLTE" not in chunks:
                fail("indexed PNG missing palette")
            if chunks and chunks[-1] not in (b"IHDR", b"PLTE", b"tRNS", b"IDAT"):
                fail("invalid IDAT ordering")
            if len(compressed) + length > MAX_RAW_BYTES:
                fail("compressed PNG exceeds safety limit")
            compressed.extend(payload)
            seen_idat = True
        elif kind == b"IEND":
            if not seen_idat or length or end != len(data):
                fail("missing IDAT or trailing bytes")
            seen_end = True
        if kind == b"PLTE":
            chunks_palette_size = length // 3
        chunks.append(kind)
        pos = end
    if not seen_end:
        fail("missing IEND")
    try:
        decoder = zlib.decompressobj()
        raw = decoder.decompress(compressed, expected + 1)
        if len(raw) != expected or not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
            fail("invalid or oversized image data")
        if any(raw[row * (rowbytes + 1)] > 4 for row in range(height)):
            fail("invalid PNG row filter")
    except zlib.error as exc:
        fail(f"invalid compressed image data: {exc}")


def validate_public_pngs(assets: Path) -> None:
    for path in sorted(assets.rglob("*")):
        if path.is_file() and path.suffix.lower() == ".png":
            validate_png(path.read_bytes(), str(path))
