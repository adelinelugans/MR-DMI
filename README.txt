import base64, json, os
from flask import Flask, request, render_template_string
import anthropic

app = Flask(__name__)
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5")
SCANNERS = ["Magnetom Altea 1,5 T", "Magnetom Sola 1,5 T", "Magnetom Flow 1,5 T"]


def read_card(img_bytes, media_type):
    client = anthropic.Anthropic()  # lit ANTHROPIC_API_KEY
    msg = client.messages.create(
        model=MODEL, max_tokens=500,
        messages=[{"role": "user", "content": [
            {"type": "image", "source": {"type": "base64", "media_type": media_type,
                                         "data": base64.b64encode(img_bytes).decode()}},
            {"type": "text", "text": (
                "Carte de porteur d'un dispositif médical implantable. Réponds UNIQUEMENT en JSON : "
                '{"fabricant":"","modele":"","numero_serie":"","type":"","date_implantation":""}. '
                "Laisse vide ce qui n'est pas lisible. N'invente rien.")}]}])
    txt = msg.content[0].text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(txt)


CACHE = {}


def lookup(card, scanner):
    modele = (card.get("modele") or "").strip()
    if not modele:
        return None
