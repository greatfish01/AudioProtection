import os
import torch
import torchaudio
import ffmpeg
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
from flask import Flask, request, jsonify, send_file, url_for, make_response
from flask_cors import CORS
import numpy as np
import uuid
from eval import main  # Assuming `main` is a function in `eval` that returns classification results

# Initialize Flask app
app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'input_data'
PROCESSED_FOLDER = 'generate'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

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
    model_path = "D://07. 專題//ai-detection//model.pth"
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
    # Retrieve the binary classification result from the last uploaded audio
    result_binary = classification_results.get("last_binary_result")
    if result_binary is None:
        return jsonify({'error': 'No binary classification result found. Please upload an audio file first.'}), 404

    return jsonify({'result_binary': result_binary}), 200

@app.route('/attack', methods=['POST'])
def attack():
    """Perform an adversarial attack on uploaded audio."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Convert file to WAV format if necessary
    file_path = convert_to_wav(file_path)

    try:
        waveform, sample_rate = load_audio_file(file_path)
        processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
        model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")

        if waveform.size(0) > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)

        if sample_rate != 16000:
            transform = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
            waveform = transform(waveform)

        input_values = processor(waveform.squeeze().numpy(), return_tensors="pt", sampling_rate=16000, padding=True).input_values
        input_values.requires_grad = True

        epsilon = 0.01
        alpha = 0.0008
        num_iterations = 35

        for i in range(num_iterations):
            logits = model(input_values).logits
            target = torch.zeros(logits.size(0), dtype=torch.long)
            loss = torch.nn.functional.ctc_loss(
                logits.transpose(0, 1), target,
                input_lengths=torch.tensor([logits.size(1)]),
                target_lengths=torch.tensor([target.size(0)])
            )
            model.zero_grad()
            loss.backward()

            perturbation = alpha * input_values.grad.sign()
            input_values = input_values + perturbation
            input_values = torch.clamp(input_values, min=input_values - epsilon, max=input_values + epsilon).detach_()
            input_values.requires_grad = True

        adv_input = input_values.detach().cpu().numpy()[0]
        adv_waveform = torch.Tensor(adv_input).unsqueeze(0)
        adv_waveform = torch.clamp(adv_waveform, min=-1.0, max=1.0)

        noise_level = 0.01
        duration = 1.0
        freq = 100  
        fs = 441  
        low_freq_noise = 0.5 * np.sin(2 * np.pi * freq * np.linspace(0, duration, int(fs * duration), endpoint=False)) 
        low_freq_noise = torch.from_numpy(low_freq_noise)

        if len(adv_waveform) < len(low_freq_noise):
            low_freq_noise = low_freq_noise[:len(adv_waveform)]
        else:
            adv_waveform = adv_waveform[:len(low_freq_noise)]

        adv_waveform = adv_waveform + noise_level * low_freq_noise
        adv_waveform = torch.clamp(adv_waveform, min=-1.0, max=1.0)
        adv_waveform_16 = (adv_waveform.numpy() * 32767).astype(np.int16)

        unique_filename = f"adversarial_{uuid.uuid4()}.wav"
        output_file = os.path.join(PROCESSED_FOLDER, unique_filename)
        torchaudio.save(output_file, torch.from_numpy(adv_waveform_16), sample_rate)

        os.remove(file_path)

        # Return file URL instead of the file directly
        response = {
            'message': 'Adversarial attack completed successfully',
            'filePath': url_for('get_audio', filename=unique_filename, _external=True)
        }
        return jsonify(response), 200

    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({'error': 'Error processing file'}), 500

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
