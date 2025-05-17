import os
import logging, json
from io import BytesIO

from flask import Flask, request, jsonify
from flask_cors import CORS

import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.resnet import preprocess_input


# —————— Setup logging ——————
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("minor_backend")

# —————— App & model ——————
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

model = load_model('plant_disease_model.h5')

# 1) Load class→index mapping from JSON
with open("class_indices.json", "r", encoding="utf-8") as f:
    label_to_index = json.load(f)

# 2) Invert to index→class mapping
class_indices = {v: k for k, v in label_to_index.items()}


# severity mapping by class name
severity_mapping = {
    "Pepper__bell___Bacterial_spot": "High infection",
    "Pepper__bell___healthy": "None",

    "Potato___Early_blight": "Moderate",
    "Potato___Late_blight": "High infection",
    "Potato___healthy": "None",

    "Tomato_Bacterial_spot": "High infection",
    "Tomato_Early_blight": "Moderate",
    "Tomato_Late_blight": "High infection",
    "Tomato_Leaf_Mold": "Mild",
    "Tomato_Septoria_leaf_spot": "Moderate",
    "Tomato_Spider_mites_Two_spotted_spider_mite": "Mild",
    "Tomato__Target_Spot": "Moderate",
    "Tomato__Tomato_YellowLeaf__Curl_Virus": "High infection",
    "Tomato__Tomato_mosaic_virus": "Mild",
    "Tomato_healthy": "None"
}




@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    # load and preprocess
    image = request.files['image']
    img = load_img(BytesIO(image.read()), target_size=(224, 224))
    arr = img_to_array(img)
    arr = preprocess_input(arr)
    arr = np.expand_dims(arr, axis=0)

    # predict
    preds = model.predict(arr)                # shape (1, N)
    preds = preds[0]                           # shape (N,)
    idx = int(np.argmax(preds))
    confidence = round(100 * float(preds[idx]), 2)

    # debug log
   # logger.info(f"Output array length: {length}")
    #logger.info(f"Raw outputs: {preds.tolist()}")
    #logger.info(f"Chosen index: {idx}")

    # map to label (might KeyError)
    label = class_indices.get(idx, f"Unknown({idx})")
    severity = severity_mapping.get(label, "Unknown")

     # debug info
    logger.info(f"Predicted index: {idx}, label: {label}, confidence: {confidence}%")

    return jsonify({
        'predicted_label': label,
        'confidence': confidence,
         'severity': severity,
        'debug': {
            'confidence_scores': preds.tolist(),
            'chosen_index': idx
        }
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    app.run(host='0.0.0.0', port=port)
