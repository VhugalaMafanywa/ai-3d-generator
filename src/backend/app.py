from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cohere
from flask import url_for

app = Flask(__name__)
CORS(app)

COHERE_API_KEY = "Z4vOSl46rgKlfaA1KO7t1sjRxZrf0TWbyfa2hezL"
BACKEND_URL = os.getenv("BACKEND_URL")
MODEL_FOLDER = "static/models"

MODEL_MAPPING = {
    "hat": "hard_hat.glb",
    "hard hat": "hard_hat.glb",
    "helmet": "hard_hat.glb",
    "extinguisher": "fire_extinguisher.glb",
    "fire extinguisher": "fire_extinguisher.glb",
    "camera": "CCTV Camera.glb",
    "table": "Table.glb",
    "ladder": "Ladder.glb"
}

co = cohere.ClientV2(api_key=COHERE_API_KEY) if COHERE_API_KEY else None

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    user_text = data.get('text', '').strip()
    image_base64 = data.get('image')
    if not user_text and not image_base64:
        return jsonify({"error": "Please provide text or upload an image"}), 400

object_name = user_text  

        if image_base64:
            try:
                
                vision_messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "What is the main object shown in this image? Reply with only the name or short description (1-5 words). Do not explain."},
                            {"type": "image_url", "image_url": {"url": image_base64 if image_base64.startswith("data:") else f"data:image/jpeg;base64,{image_base64}"}}
                        ]
                    }
                ]

                vision_response = co.chat(
                    model="command-a-vision-07-2025",
                    messages=vision_messages,
                    temperature=0.3,
                    max_tokens=50
                )

                identified = ""
                for item in vision_response.message.content:
                    if hasattr(item, 'text'):
                        identified += item.text
                    elif hasattr(item, 'type') and item.type == "text":
                        identified += item.text

                object_name = identified.strip()
                print(f"Vision identified object as: {object_name}")

            except Exception as e:
                print("Vision identification failed:", str(e))
                object_name = user_text or "unknown object"

        
        summary = f"Educational summary for: {object_name}"

        if co:
            try:
                reasoning_prompt = (
                    f"You are a helpful educator. The object is: {object_name}.\n"
                    f"User description: {user_text}\n\n"
                    "Give a short, interesting 2-4 sentence educational summary. "
                    "Explain its purpose, how it works, history, safety tips, or fun facts. "
                    "Do not just repeat what the object is."
                )

                response = co.chat(
                    model="command-a-reasoning-08-2025",
                    messages=[
                        {"role": "system", "content": "You are a helpful educator."},
                        {"role": "user", "content": reasoning_prompt}
                    ],
                    temperature=0.7,
                )

                full_text = ""
                for item in response.message.content:
                    if hasattr(item, 'type') and item.type == "thinking":
                        print(f"Reasoning: {item.thinking[:300]}...")
                    elif hasattr(item, 'text'):
                        full_text += item.text
                    elif hasattr(item, 'type') and item.type == "text":
                        full_text += item.text

                if full_text.strip():
                    summary = full_text.strip()

            except Exception as e:
                print("Reasoning Error:", str(e))
                summary = f"Educational information about {object_name}."

    model_filename = "default.glb"
    lower_name = object_name.lower()
    for keyword, filename in MODEL_MAPPING.items():
        if keyword in lower_name:
            model_filename = filename
            break

    model_url = url_for('static', filename=f"models/{model_filename}", _external=True)
    return jsonify({"model_url": model_url, "summary": summary, "identified_object": object_name})

if __name__ == '__main__':
    os.makedirs(MODEL_FOLDER, exist_ok=True)
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
