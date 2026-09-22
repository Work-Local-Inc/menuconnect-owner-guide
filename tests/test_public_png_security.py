"""Regression checks for metadata-free, structurally sound published PNGs."""
import binascii
from pathlib import Path
import struct
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from public_png import validate_png, validate_public_pngs  # noqa: E402


def chunk(kind, payload=b""):
    body = kind + payload
    return struct.pack(">I", len(payload)) + body + struct.pack(">I", binascii.crc32(body) & 0xffffffff)


class PublicPNGTests(unittest.TestCase):
    def setUp(self):
        import zlib
        self.ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
        self.idat = chunk(b"IDAT", zlib.compress(b"\0\x11\x22\x33"))
        self.iend = chunk(b"IEND")
        self.signature = b"\x89PNG\r\n\x1a\n"

    def png(self, *parts):
        return self.signature + self.ihdr + b"".join(parts or (self.idat,)) + self.iend

    def test_clean_png_accepted(self):
        validate_png(self.png(), "clean")

    def test_all_ancillary_metadata_rejected(self):
        for kind in (b"iTXt", b"tEXt", b"zTXt", b"eXIf", b"iCCP", b"pHYs", b"sRGB", b"tIME", b"aaAa"):
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                validate_png(self.png(chunk(kind, b"private"), self.idat), "metadata")

    def test_malformed_pngs_fail_closed(self):
        good = self.png()
        bad = (b"", good[:7], good[:-2], good + b"secret", good[:12] + b"\xff" + good[13:],
               self.signature + self.ihdr + self.iend, self.png(chunk(b"ABCD")), self.png(chunk(b"iTXt", b"x"))[:-12],
               self.signature + self.ihdr + chunk(b"IDAT", b"not deflate") + self.iend,
               self.signature + self.ihdr + self.idat + self.idat + self.iend)
        for sample in bad:
            with self.subTest(sample=sample[:24]), self.assertRaises(ValueError):
                validate_png(sample, "malformed")

    def test_repository_assets_have_no_metadata(self):
        validate_public_pngs(ROOT / "assets")

    def test_other_public_images_have_no_embedded_exif_or_xmp(self):
        jpg = (ROOT / "assets/menuconnect-share.jpg").read_bytes()
        self.assertNotIn(b"Exif\x00\x00", jpg)
        self.assertNotIn(b"http://ns.adobe.com/xap/1.0/", jpg)
        webp = (ROOT / "assets/wok-bistro-hero.webp").read_bytes()
        self.assertEqual(webp[:4] + webp[8:12], b"RIFFWEBP")
        self.assertEqual(struct.unpack_from("<I", webp, 4)[0], len(webp) - 8)
        pos = 12
        while pos < len(webp):
            kind = webp[pos:pos + 4]
            self.assertNotIn(kind, (b"EXIF", b"XMP ", b"ICCP"))
            size = struct.unpack_from("<I", webp, pos + 4)[0]
            pos += 8 + size + (size & 1)
        self.assertEqual(pos, len(webp))
        self.assertFalse(webp[20] & (0x08 | 0x04 | 0x20))  # EXIF, XMP, ICC flags in VP8X

    def test_nested_public_png_is_scanned(self):
        from tempfile import TemporaryDirectory
        with TemporaryDirectory() as temp:
            path = Path(temp) / "screenshots" / "private.png"
            path.parent.mkdir()
            path.write_bytes(self.png(chunk(b"tEXt", b"private"), self.idat))
            with self.assertRaisesRegex(ValueError, "private.png"):
                validate_public_pngs(Path(temp))

    def test_build_rejects_metadata_before_creating_dist(self):
        import shutil
        import subprocess
        from tempfile import TemporaryDirectory
        with TemporaryDirectory() as temp:
            root = Path(temp)
            for name in ("build.py", "public_png.py"):
                shutil.copy2(ROOT / name, root / name)
            asset = root / "assets" / "nested" / "private.png"
            asset.parent.mkdir(parents=True)
            asset.write_bytes(self.png(chunk(b"eXIf", b"private"), self.idat))
            result = subprocess.run([sys.executable, str(root / "build.py")], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("private.png", result.stderr)
            self.assertFalse((root / "dist").exists())


if __name__ == "__main__":
    unittest.main()
