#https://github.com/Kaminyou/deepspeech2-pytorch-adversarial-attack/tree/main
import os
import torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import torch
from audioseal import AudioSeal
from eddsa_signer import AudioSigner

model2 = AudioSeal.load_generator("audioseal_wm_16bits")
def load_audio_file(file_path):
    waveform, sample_rate = torchaudio.load(file_path)
    return waveform, sample_rate

 # 指定你要進行對抗攻擊的音檔路徑
audio_file = "input_data/test2.wav"  # 用你自己的音檔替換

waveform, sample_rate = load_audio_file(audio_file)


processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
  
if waveform.size(0) > 1:
    waveform = torch.mean(waveform, dim=0, keepdim=True)  # Convert to mono

    # Ensure sampling rate matches the model's expected rate
if sample_rate != 16000:
        transform = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
        waveform = transform(waveform)
        sample_rate = 16000

    # Prepare input values for the model
input_values = processor(waveform.squeeze().numpy(), return_tensors="pt", sampling_rate=16000, padding=True).input_values
input_values.requires_grad = True


def pgd_attack(sound, ori_sound, eps, alpha, data_grad):
    adv_sound = sound - alpha * data_grad.sign()
    eta = torch.clamp(adv_sound - ori_sound.data, min=-eps, max=eps)
    sound = ori_sound + eta
    return sound

PGD_round=20 #35
epsilon = 0.01
alpha = 0.0008
data_raw = input_values.clone().detach() #原始
for i in range(PGD_round):  # 多輪迭代
        print(f"PGD processing ...  {i+1} / {PGD_round}", end="\r")
        input_values.requires_grad = True
        logits = model(input_values).logits  # 通過模型進行預測
        target = torch.zeros(logits.size(0), dtype=torch.long)
        loss = torch.nn.functional.ctc_loss(
            logits.transpose(0, 1), target,
            input_lengths=torch.tensor([logits.size(1)]),
            target_lengths=torch.tensor([target.size(0)])
        )
        model.zero_grad()
        loss.backward()  # 計算梯度
        data_grad = input_values.grad.data
        # 根據計算出的梯度來更新數據
        input_values = pgd_attack(input_values, data_raw, epsilon, alpha, data_grad).detach_()
perturbed_data = input_values
#########################################

adv_input = perturbed_data.detach().cpu().numpy()[0]
adv_waveform = torch.Tensor(adv_input).unsqueeze(0)
adv_waveform = torch.clamp(adv_waveform, min=-1.0, max=1.0)
print(adv_waveform.shape)
adv_waveform=adv_waveform.unsqueeze(1)
watermark=model2.get_watermark(adv_waveform,sample_rate)
watermarked_audio = adv_waveform + watermark
watermarked_audio = watermarked_audio.squeeze(0)  # 移除第一個維度
watermarked_audio = watermarked_audio.detach().numpy()

def _main_sign(signing_key_path,input_path,output_path):
    audio_signer = AudioSigner()
    audio_signer.import_keys(signing_key_path=signing_key_path)
    audio_signer.sign(input_path, output_path)

output_file = "generate/test2.wav"
torchaudio.save(output_file, torch.from_numpy(watermarked_audio), sample_rate)

signing_key_path="key/signing_key.pem"

_main_sign(signing_key_path,output_file,output_file)

# adv_waveform = adv_waveform.cpu().numpy()


    # Verify saved file
waveform_loaded, sample_rate_loaded = torchaudio.load(output_file)
print("Successfully generated adversarial audio.")


with torch.no_grad():
        _, pred = torch.max(model(waveform).logits, 1)
        watermarked_audio = torch.from_numpy(watermarked_audio).float()  
        _, pred_adv = torch.max(model(watermarked_audio).logits, 1)

print(f"Original prediction (ground truth):\t{pred.tolist()[0]}")
print(f"Adversarial prediction:\t\t\t{pred_adv.tolist()[0]}")

