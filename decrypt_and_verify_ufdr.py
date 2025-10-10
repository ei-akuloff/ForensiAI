#!/usr/bin/env python3
"""
decrypt_and_verify_ufdr.py

Decrypt a .ufdr.enc file using its key/IV JSON, verify SHA-256, and extract into a folder.

Usage:
  python decrypt_and_verify_ufdr.py \
      --enc "ufdr_full.ufdr.enc" \
      --keyjson "ufdr_full.key.json" \
      --sha256txt "ufdr_full.ufdr.sha256.txt" \
      --outdir "C:\Users\pputhran\Desktop\ufdr-dataset-prep\dataset\ufdr_decrypted"
"""

import argparse
import base64
import hashlib
import sys
from pathlib import Path
import zipfile

try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend
except ImportError:
    print("Install cryptography: pip install cryptography")
    sys.exit(1)

import json

def decrypt_ufdr(enc_path: Path, key_json: Path, output_path: Path):
    # Load key/IV
    keyinfo = json.loads(key_json.read_text(encoding="utf-8"))
    key = base64.b64decode(keyinfo["key_base64"])
    iv = base64.b64decode(keyinfo["iv_base64"])

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    unpadder = padding.PKCS7(128).unpadder()

    data = enc_path.read_bytes()
    decrypted_padded = decryptor.update(data) + decryptor.finalize()
    decrypted = unpadder.update(decrypted_padded) + unpadder.finalize()

    output_path.write_bytes(decrypted)
    print(f"[+] Decrypted UFDR written to: {output_path}")
    return output_path

def verify_sha256(decrypted_path: Path, sha_txt_path: Path):
    expected = sha_txt_path.read_text(encoding="utf-8").strip().split()[0]
    h = hashlib.sha256()
    with open(decrypted_path, "rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    actual = h.hexdigest()
    print(f"[+] SHA-256 expected: {expected}")
    print(f"[+] SHA-256 actual  : {actual}")
    if actual.lower() == expected.lower():
        print("[+] Hash matches!")
        return True
    else:
        print("[!] Hash mismatch!")
        return False

def extract_ufdr(decrypted_path: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(decrypted_path, "r") as zf:
        zf.extractall(out_dir)
    print(f"[+] UFDR contents extracted to: {out_dir}")

def main():
    parser = argparse.ArgumentParser(description="Decrypt .ufdr.enc, verify SHA-256, extract UFDR")
    parser.add_argument("--enc", required=True, help="Path to .ufdr.enc file")
    parser.add_argument("--keyjson", required=True, help="Path to key JSON")
    parser.add_argument("--sha256txt", required=True, help="Path to SHA-256 txt file")
    parser.add_argument("--outdir", required=True, help="Folder to extract UFDR contents")
    args = parser.parse_args()

    enc_path = Path(args.enc).resolve()
    key_json = Path(args.keyjson).resolve()
    sha_txt = Path(args.sha256txt).resolve()
    out_dir = Path(args.outdir).resolve()
    decrypted_ufdr = out_dir / (enc_path.stem + ".decrypted.ufdr")

    # Step 1: Decrypt
    decrypt_ufdr(enc_path, key_json, decrypted_ufdr)

    # Step 2: Verify SHA-256
    if not verify_sha256(decrypted_ufdr, sha_txt):
        print("[!] Warning: SHA-256 mismatch. File may be corrupted or tampered.")
        sys.exit(1)

    # Step 3: Extract
    extract_ufdr(decrypted_ufdr, out_dir)
    print("[+] Done!")

if __name__ == "__main__":
    main()
