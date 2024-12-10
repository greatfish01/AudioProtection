import os
import torch
import torchaudio
import ffmpeg
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
from flask import Flask, request, jsonify, send_file, url_for, make_response
from flask_cors import CORS
import numpy as np
import uuid
from eval import load_model, load_model_config,evaluate_model, main
from audioseal import AudioSeal
from keras.models import load_model
from models import SSDNet1D  # Import the TSSDNet definition
from model import RawNet  # Import the RawNet definition
from eddsa_signer import AudioSigner

# Initialize Flask app
app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'input_data'
PROCESSED_FOLDER = 'generate'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Load generator and detector models
generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")

# Dictionary to store classification results
classification_results = {
    "last_filename": None,
    "last_binary_result": None
}

def load_audio_file(file_path):
    """Load an audio file and return waveform and sample rate."""
    try:
        waveform, sample_rate = torchaudio.load(file_path)
        print(f"Successfully loaded audio file with sample rate {sample_rate}")
        return waveform, sample_rate
    except Exception as e:
        print(f"Error loading audio file: {e}")
        raise

def convert_to_wav(file_path):
    """Convert any non-wav file to wav format using ffmpeg."""
    output_path = os.path.splitext(file_path)[0] + '_converted.wav'
    try:
        print(f"Attempting to convert {file_path} to WAV format using ffmpeg.")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        (
            ffmpeg
            .input(file_path, fflags='+genpts')
            .output(output_path, ar=16000, ac=1, format='wav')
            .run()
        )
        print(f"Successfully converted {file_path} to {output_path}")
        return output_path
    except ffmpeg.Error as e:
        print(f"Error converting audio file with ffmpeg: {e.stderr.decode('utf8')}")
        raise

# def load_rawnet2_model(model_path):
#     """Load the RawNet2 model using PyTorch."""
#     config = load_model_config('model_config_RawNet.yaml')  # Replace with your RawNet config path
#     device = 'cuda' if torch.cuda.is_available() else 'cpu'
#     model = RawNet(config['model'], device).to(device)
#     model.load_state_dict(torch.load(model_path, map_location=device))
#     model.eval()  # Set model to evaluation mode
#     print(f"RawNet2 model loaded from: {model_path}")
#     return model, device

# def load_tssdnet_model(model_path):
#     """Load the TSSDNet model using PyTorch."""
#     device = 'cuda' if torch.cuda.is_available() else 'cpu'
#     model = SSDNet1D().to(device)  # Ensure SSDNet1D class is correctly defined
#     checkpoint = torch.load(model_path, map_location=device)  # Load the checkpoint
#     if 'model_state_dict' in checkpoint:
#         model.load_state_dict(checkpoint['model_state_dict'])  # Load only the model state dictionary
#     else:
#         raise ValueError("The checkpoint does not contain a 'model_state_dict' key.")
#     model.eval()  # Set model to evaluation mode
#     print(f"TSSDNet model loaded from: {model_path}")
#     return model, device

# try:
#     rawnet2_model, rawnet_device = load_rawnet2_model('D://07. 專題//frontend//ai-detection-backend//model.pth')  # Path to RawNet2 model
#     tssdnet_model, tssdnet_device = load_tssdnet_model('D://07. 專題//frontend//ai-detection-backend//TSSDNet_model.pth')  # Path to TSSDNet model
#     print("RawNet2 and TSSDNet models loaded successfully.")
# except Exception as e:
#     print(f"Error loading models: {e}")

# # Function to preprocess audio for RawNet2
# def preprocess_rawnet2_input(file_path, expected_length=96000, target_sample_rate=24000):
#     # Load audio
#     waveform, sample_rate = torchaudio.load(file_path)
#     print(f"Successfully loaded audio file with sample rate {sample_rate}")
    
#     # Resample to the target sample rate if necessary
#     if sample_rate != target_sample_rate:
#         waveform = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=target_sample_rate)(waveform)
#         sample_rate = target_sample_rate

#     # Convert to NumPy array
#     rawnet_input_data = waveform.squeeze().numpy()
    
#     # Normalize input length (truncate or pad to `expected_length`)
#     if rawnet_input_data.shape[0] > expected_length:
#         rawnet_input_data = rawnet_input_data[:expected_length]  # Truncate
#     elif rawnet_input_data.shape[0] < expected_length:
#         rawnet_input_data = np.pad(rawnet_input_data, (0, expected_length - rawnet_input_data.shape[0]), 'constant')  # Pad with zeros

#     # Convert to tensor with shape (1, 1, num_samples)
#     rawnet_input_tensor = torch.tensor(rawnet_input_data).view(1, 1, -1).float()
#     print(f"RawNet2 input tensor shape: {rawnet_input_tensor.shape}")
#     return rawnet_input_tensor

# def preprocess_tssdnet_input(input_data, height=64, width=64, channels=1):
#     total_size = input_data.size
#     if total_size % (height * width * channels) != 0:
#         total_size = (total_size // (height * width * channels)) * (height * width * channels)
#         input_data = input_data[:total_size]

#     batch_size = total_size // (height * width * channels)
#     reshaped_data = input_data.reshape(batch_size, height, width, channels)
#     print(f"TSSDNet input data shape: {reshaped_data.shape}")
#     return reshaped_data

# def ensemble_predict(rawnet2_model, tssdnet_model, input_data, rawnet_device, weights=(0.5, 0.5)):
#     """Combine predictions from RawNet2 and TSSDNet using weighted ensemble."""

#     # RawNet2 prediction
#     input_tensor = torch.tensor(input_data, dtype=torch.float32).to(rawnet_device)
#     with torch.no_grad():
#         rawnet2_predictions = rawnet2_model(input_tensor).sigmoid().cpu().numpy()

#     # TSSDNet prediction
#     tssdnet_predictions = tssdnet_model.predict(input_data)  # Assume input_data is already preprocessed for TSSDNet

#     # Weighted ensemble
#     ensemble_predictions = (
#         weights[0] * rawnet2_predictions + weights[1] * tssdnet_predictions
#     )
#     return ensemble_predictions

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    """Upload an audio file, convert to WAV if necessary, and classify."""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    file_path = os.path.join(UPLOAD_FOLDER, audio_file.filename)
    audio_file.save(file_path)
    print(f"File saved at {file_path}")

    # Convert file to WAV format if it's not already a WAV
    if not file_path.endswith('.wav'):
        try:
            file_path = convert_to_wav(file_path)
        except Exception as e:
            return jsonify({'error': f'File conversion failed: {str(e)}'}), 500

    # Run classification on the converted WAV file
    model_path = "D:\\07. 專題\\frontend\\ai-detection-backend\\model.pth"
    try:
        result_multi, result_binary = main(file_path, model_path)
        result = {'result_multi': result_multi, 'result_binary': result_binary}

        # Store the binary result in the classification_results dictionary
        classification_results["last_filename"] = audio_file.filename
        classification_results["last_binary_result"] = result_binary

        return jsonify(result), 200
    except Exception as e:
        print(f"Error in classification: {e}")
        return jsonify({'error': 'Error in audio classification.'}), 500

@app.route('/get_binary_classification_result', methods=['GET'])
def get_binary_classification_result():
    """Retrieve the binary classification result from the last uploaded audio."""
    result_binary = classification_results.get("last_binary_result")
    if result_binary is None:
        return jsonify({'error': 'No binary classification result found. Please upload an audio file first.'}), 404

    return jsonify({'result_binary': result_binary}), 200



def pgd_attack(sound, ori_sound, eps, alpha, data_grad):
    """Perform a single PGD attack step."""
    adv_sound = sound - alpha * data_grad.sign()
    eta = torch.clamp(adv_sound - ori_sound.data, min=-eps, max=eps)
    sound = ori_sound + eta
    return sound

def pgd_attack(sound, ori_sound, eps, alpha, data_grad):
    """Perform a single PGD attack step."""
    adv_sound = sound - alpha * data_grad.sign()
    eta = torch.clamp(adv_sound - ori_sound.data, min=-eps, max=eps)
    sound = ori_sound + eta
    return sound

@app.route('/attack', methods=['POST'])
def attack():
    """Perform an adversarial attack on uploaded audio and add watermark."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Save the uploaded file
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        print(f"File saved at {file_path}")

        # Load the audio file
        waveform, sample_rate = load_audio_file(file_path)

        # Convert to mono if required
        if waveform.size(0) > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)

        # Resample to 16kHz
        if sample_rate != 16000:
            transform = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
            waveform = transform(waveform)
            sample_rate = 16000

        # Prepare input values for adversarial attack
        processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
        model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
        input_values = processor(waveform.squeeze().numpy(), return_tensors="pt", sampling_rate=16000, padding=True).input_values
        input_values.requires_grad = True

        # PGD attack parameters
        PGD_round = 20
        epsilon = 0.01
        alpha = 0.0008
        data_raw = input_values.clone().detach()

        # Perform PGD attack
        for i in range(PGD_round):
            print(f"PGD processing ...  {i+1} / {PGD_round}", end="\r")
            input_values.requires_grad = True
            logits = model(input_values).logits
            target = torch.zeros(logits.size(0), dtype=torch.long)
            loss = torch.nn.functional.ctc_loss(
                logits.transpose(0, 1), target,
                input_lengths=torch.tensor([logits.size(1)]),
                target_lengths=torch.tensor([target.size(0)])
            )
            model.zero_grad()
            loss.backward()
            data_grad = input_values.grad.data
            input_values = pgd_attack(input_values, data_raw, epsilon, alpha, data_grad).detach_()

        # Generate adversarial waveform
        adv_input = input_values.squeeze().detach().cpu().numpy()
        adv_waveform = torch.tensor(adv_input).unsqueeze(0)
        adv_waveform = torch.clamp(adv_waveform, min=-1.0, max=1.0)

        # Apply watermark using AudioSeal
        adv_waveform = adv_waveform.unsqueeze(1)
        watermark = generator.get_watermark(adv_waveform, sample_rate)
        watermarked_audio = adv_waveform + watermark
        watermarked_audio = watermarked_audio.squeeze(0).detach().numpy()

        # Save the adversarial watermarked audio
        output_file = os.path.join(PROCESSED_FOLDER, f"adversarial_{uuid.uuid4()}.wav")
        torchaudio.save(output_file, torch.from_numpy(watermarked_audio), sample_rate)

        # Optional: Sign the audio file
        signing_key_path = "key/signing_key.pem"
        audio_signer = AudioSigner()
        audio_signer.import_keys(signing_key_path=signing_key_path)
        audio_signer.sign(output_file, output_file)

        # Verify the adversarial effect
        with torch.no_grad():
            original_logits = model(processor(waveform.squeeze().numpy(), return_tensors="pt", sampling_rate=16000).input_values).logits
            adversarial_logits = model(processor(watermarked_audio, return_tensors="pt", sampling_rate=16000).input_values).logits

            _, original_pred = torch.max(original_logits, 1)
            _, adversarial_pred = torch.max(adversarial_logits, 1)

        # Response
        response = {
            "message": "Adversarial attack and watermarking completed successfully",
            "original_prediction": original_pred.tolist(),
            "adversarial_prediction": adversarial_pred.tolist(),
            "file_path": url_for('get_audio', filename=os.path.basename(output_file), _external=True)
        }
        print(f"Response: {response}")
        return jsonify(response), 200

    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500


@app.route('/get_audio/<filename>', methods=['GET'])
def get_audio(filename):
    """Serve the generated audio file with correct headers."""
    output_file = os.path.join(PROCESSED_FOLDER, filename)
    if os.path.exists(output_file):
        response = make_response(send_file(output_file, download_name=filename, mimetype='audio/wav'))
        response.headers['Access-Control-Allow-Origin'] = '*'  # Ensure CORS headers
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'  # Disable caching
        return response
    return jsonify({'message': 'No output file found.'}), 404

@app.route("/generate", methods=["POST"])
def generate_watermark():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        input_file_path = os.path.join(UPLOAD_FOLDER, audio_file.filename)
        audio_file.save(input_file_path)

        # Convert to WAV if necessary
        if not input_file_path.endswith(".wav"):
            input_file_path = convert_to_wav(input_file_path)

        # Load audio
        waveform, sample_rate = load_audio_file(input_file_path)
        audios = waveform.unsqueeze(0)  # Add batch dimension

        # Pass the audio through the generator for watermarking
        with torch.no_grad():
            watermarked_audio = generator(audios, sample_rate=sample_rate, alpha=1.0)

        # Save the watermarked audio
        output_file_name = f"watermarked_{uuid.uuid4()}.wav"
        output_file_path = os.path.join(PROCESSED_FOLDER, output_file_name)
        torchaudio.save(output_file_path, watermarked_audio.squeeze(0), sample_rate)

        # Return the file URL
        response = {
            "message": "Watermarked audio generated successfully",
            "filePath": url_for("get_audio", filename=output_file_name, _external=True),
        }
        return jsonify(response), 200
    except Exception as e:
        print(f"Error during watermark generation: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/detect", methods=["POST"])
def detect_watermark():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        input_file_path = os.path.join(UPLOAD_FOLDER, audio_file.filename)
        audio_file.save(input_file_path)

        # Convert to WAV if necessary
        if not input_file_path.endswith(".wav"):
            input_file_path = convert_to_wav(input_file_path)

        # Load audio
        waveform, sample_rate = load_audio_file(input_file_path)
        audios = waveform.unsqueeze(0)  # Add batch dimension

        # Pass the audio through the detector to check for watermark
        with torch.no_grad():
            result, message = detector.detect_watermark(audios, sample_rate=sample_rate, message_threshold=0.5)

        # Process the detected message
        binary_message = None
        if message is not None:
            # Convert the message to a binary representation (if applicable)
            binary_message = [int(round(bit)) for bit in message.squeeze().tolist()]
            print(f"Detected Binary Message: {','.join(map(str, binary_message))}")  # Print as binary string

        # Return the detection result with the message
        response = {
            "watermark_detected": result,  # Use the float value directly
            "binary_message": binary_message,  # Include the binary message
            "raw_message": message.tolist() if message is not None else None,  # Include raw message
        }
        return jsonify(response), 200
    except Exception as e:
        print(f"Error during watermark detection: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
