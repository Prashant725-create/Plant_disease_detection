import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 1) Pull your model‐repo name and token from the ENVIRONMENT:
HF_MODEL = os.getenv("HF_MODEL", "Prashant-467/plant-disease-detector")
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise RuntimeError("Missing HF_TOKEN environment variable")

# 2) Build your inference endpoint and headers dynamically:
API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}

def predict_image(image_bytes: bytes):
    """
    Send the raw bytes of an image to HF Inference API
    and return the JSON response.
    """
    resp = requests.post(API_URL, headers=HEADERS, files={"file": image_bytes})
    resp.raise_for_status()
    return resp.json()

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_bytes = request.files['image'].read()
    result = predict_image(image_bytes)

    # the Hugging Face API will already return something like:
    # [{"label": "...", "score": 0.95}, ...]
    return jsonify(result)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
