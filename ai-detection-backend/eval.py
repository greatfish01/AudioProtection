import argparse
import numpy as np
import torch
from torch import nn, Tensor
import yaml
from model import RawNet
import soundfile as sf
import librosa
from torch.nn import functional as F

def pad(x, max_len=96000):
    """Pad or trim the input array to a fixed length."""
    x_len = x.shape[0]
    if x_len >= max_len:
        return x[:max_len]
    # Pad by repeating the signal to fill up max_len
    num_repeats = (max_len // x_len) + 1
    padded_x = np.tile(x, num_repeats)[:max_len]
    return padded_x

def load_sample(sample_path, max_len=96000):
    """Load and preprocess audio file for model input using soundfile and librosa."""
    y_list = []

    try:
        # Load the audio file using soundfile
        waveform, sr = sf.read(sample_path)
        waveform = np.asarray(waveform)  # Convert waveform to numpy array
        print(f"Loaded audio file: {sample_path}")
        print(f"Sampling rate: {sr}, Audio length: {waveform.shape[0]}")
    except Exception as e:
        print(f"Error loading audio file: {e}")
        return []

    # Resample if the sampling rate is not 24kHz
    if sr != 24000:
        waveform = librosa.resample(waveform, orig_sr=sr, target_sr=24000)
        sr = 24000
        print(f"Resampled audio to 24kHz")

    # If the length is less than max_len, pad and return a single segment
    if waveform.shape[0] <= max_len:
        return [Tensor(pad(waveform, max_len))]

    # Split the audio into chunks of max_len
    for i in range(0, waveform.shape[0], max_len):
        y_seg = waveform[i:i+max_len]
        y_pad = pad(y_seg, max_len)
        y_inp = Tensor(y_pad)
        y_list.append(y_inp)

    return y_list

def load_model_config(config_path='model_config_RawNet.yaml'):
    """Load the model configuration from a YAML file."""
    try:
        with open(config_path, 'r') as f_yaml:
            config = yaml.safe_load(f_yaml)
        print(f"Loaded model config from: {config_path}")
        return config
    except Exception as e:
        print(f"Error loading model config: {e}")
        raise

def load_model(model_path, config, device):
    """Load the model with weights and send it to the device."""
    try:
        model = RawNet(config['model'], device).to(device)
        model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
        model.eval()  # Set model to evaluation mode
        print(f"Loaded model from: {model_path}")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        raise

def evaluate_model(model, input_path, device):
    """Run inference on the input audio and return classification results."""
    out_list_multi = []
    out_list_binary = []

    for m_batch in load_sample(input_path):
        m_batch = m_batch.to(device=device, dtype=torch.float).unsqueeze(0)
        try:
            logits, multi_logits = model(m_batch)
            probs = F.softmax(logits, dim=-1)
            probs_multi = F.softmax(multi_logits, dim=-1)

            out_list_multi.append(probs_multi.tolist()[0])
            out_list_binary.append(probs.tolist()[0])
        except Exception as e:
            print(f"Error during model inference: {e}")
            return [], []

    result_multi = np.mean(out_list_multi, axis=0).tolist() if out_list_multi else [0.0] * 7  # Assuming 7 classes
    result_binary = np.mean(out_list_binary, axis=0).tolist() if out_list_binary else [0.0, 0.0]

    return result_multi, result_binary

def main(input_path, model_path):
    """Main function to load model, run inference, and print results."""
    # Load the model configuration
    config = load_model_config()

    # Determine the device (GPU or CPU)
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f'Device: {device}')

    # Load the model
    model = load_model(model_path, config, device)
    print(f'Model loaded: {model_path}')

    # Evaluate the model
    result_multi, result_binary = evaluate_model(model, input_path, device)

    # Print results
    print(f'Multi-class classification result: '
          f'gt:{result_multi[0]}, wavegrad:{result_multi[1]}, diffwave:{result_multi[2]}, '
          f'parallel wave gan:{result_multi[3]}, wavernn:{result_multi[4]}, wavenet:{result_multi[5]}, melgan:{result_multi[6]}')

    print(f'Binary classification result: fake:{result_binary[0]}, real:{result_binary[1]}')
    return result_multi, result_binary

if __name__ == '__main__':
    pass
    # parser = argparse.ArgumentParser()
    # parser.add_argument('--input_path', type=str, required=True, help="C:\\Users\\MA302\\Documents\\ai-detection\\assets\\search_fake_2.wav")
    # parser.add_argument('--model_path', type=str, required=True, help="C:\\Users\\MA302\\Documents\\ai-detection\\model.pth")

    # args = parser.parse_args()

    # main(args.input_path, args.model_path)