#!/usr/bin/env python3
"""
Descarga las ultimas publicaciones de Instagram (cuenta de empresa/creador)
usando la Graph API de Meta y las guarda en el repositorio:
  - assets/ig/<id>.jpg   (imagenes locales, no expiran)
  - assets/instagram.json (lista de posts: imagen local, enlace, texto, fecha)

Secrets requeridos (variables de entorno):
  IG_TOKEN    -> token de acceso de larga duracion
  IG_USER_ID  -> ID de la cuenta de Instagram (business)

Si falta el token o la API falla, NO rompe el sitio: deja el JSON como estaba.
"""
import os, sys, json, urllib.request, urllib.parse, pathlib

API = "https://graph.facebook.com/v21.0"
LIMIT = 9
OUT_JSON = "assets/instagram.json"
IMG_DIR = "assets/ig"

def http_get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read().decode())

def main():
    token = os.environ.get("IG_TOKEN", "").strip()
    user_id = os.environ.get("IG_USER_ID", "").strip()
    if not token or not user_id:
        print("ERROR: faltan IG_TOKEN o IG_USER_ID. No se actualiza el feed.")
        return 0  # no fallar el workflow

    fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
    url = "%s/%s/media?fields=%s&limit=%d&access_token=%s" % (
        API, user_id, fields, LIMIT, urllib.parse.quote(token))
    try:
        data = http_get(url)
    except Exception as e:
        print("ERROR al consultar la API de Instagram:", e)
        return 0

    if "data" not in data:
        print("Respuesta inesperada de la API:", json.dumps(data)[:400])
        return 0

    pathlib.Path(IMG_DIR).mkdir(parents=True, exist_ok=True)
    posts = []
    for item in data["data"]:
        mtype = item.get("media_type")
        img_url = item.get("media_url") if mtype != "VIDEO" else item.get("thumbnail_url")
        if not img_url:
            img_url = item.get("thumbnail_url") or item.get("media_url")
        if not img_url:
            continue
        pid = item["id"]
        local = "%s/%s.jpg" % (IMG_DIR, pid)
        try:
            urllib.request.urlretrieve(img_url, local)
        except Exception as e:
            print("No se pudo descargar", pid, e)
            continue
        posts.append({
            "id": pid,
            "image": local,
            "permalink": item.get("permalink", "https://www.instagram.com/bayolcell"),
            "caption": (item.get("caption") or "")[:140],
            "timestamp": item.get("timestamp", ""),
        })

    if not posts:
        print("No se obtuvieron publicaciones; se mantiene el feed anterior.")
        return 0

    # Limpia imagenes viejas que ya no estan en el feed
    keep = {p["id"] + ".jpg" for p in posts}
    for f in pathlib.Path(IMG_DIR).glob("*.jpg"):
        if f.name not in keep:
            try: f.unlink()
            except Exception: pass

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    print("OK: %d publicaciones guardadas." % len(posts))
    return 0

if __name__ == "__main__":
    sys.exit(main())
