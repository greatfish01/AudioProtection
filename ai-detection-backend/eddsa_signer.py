# https://github.com/felixlimanta/eddsa-lossless-audio-signer/blob/master/eddsa-signer.py
import ed25519
from lsb_steganography import AudioLSB
import os
import base64
# 手動指定 FFmpeg 的環境變數
os.environ["FFMPEG_BINARY"] = r"C:\ffmpeg\ffmpeg-7.1-essentials_build\bin\ffmpeg.exe"
from pydub import AudioSegment
# AudioSegment.converter = r"C:\path\to\ffmpeg.exe"

class AudioSigner:
    lsb_normalizer = bytes([0] * 64)

    def generate_keys(self):
        self.signing_key, self.verifying_key = ed25519.create_keypair() 
        #私鑰             #公鑰    

    def export_keys(self, signing_key_path=None, verifying_key_path=None):
        if signing_key_path is not None:
            open(signing_key_path, 'wb').write(self.signing_key.to_bytes())

        if verifying_key_path is not None:
            open(verifying_key_path, 'wb').write(self.verifying_key.to_bytes())

    def set_keys(self, signing_key=None, verifying_key=None):
        if signing_key is not None:
            self.signing_key = signing_key

        if verifying_key is not None:
            self.verifying_key = verifying_key

    def import_keys(self, signing_key_path=None, verifying_key_path=None):
        signing_key = None
        verifying_key = None

        if signing_key_path is not None:
            keydata = open(signing_key_path, 'rb').read()
            signing_key = ed25519.SigningKey(keydata)

        if verifying_key_path is not None:
            keydata = open(verifying_key_path, 'rb').read()
            verifying_key = ed25519.VerifyingKey(keydata)
            
        self.set_keys(signing_key=signing_key, verifying_key=verifying_key)

    def import_keys2(self, keydata=None):

        verifying_key = None
        if keydata is not None:
            keydata = base64.b64decode(keydata)
            verifying_key = ed25519.VerifyingKey(keydata)
            
        self.set_keys(verifying_key=verifying_key)

    def sign(self, input_path, output_path):
        audio_lsb = AudioLSB(input_path)
        audio_lsb.encode(self.lsb_normalizer)
        signature = self.signing_key.sign(bytes(audio_lsb.audio_data))
       
        audio_lsb.encode(signature)
        audio_lsb.export(output_path)
        

    def verify(self, input_path):
        audio_lsb = AudioLSB(input_path)
        signature = audio_lsb.decode(length=64)
    
        audio_lsb.encode(self.lsb_normalizer)
        try:
            self.verifying_key.verify(signature, bytes(audio_lsb.audio_data))
            return True
        except ed25519.BadSignatureError:
            return False


input_path="input_data/test2.wav"
output_path="generate/test2.wav"
#key的檔案名稱用簽名的hash值命名
signing_key_path="key/signing_key.pem"
verifying_key_path="key/verifying_key.pem"
#密鑰 .pem
#公鑰 .pub

# Generate keys
def _main_generate_keys(signing_key_path,verifying_key_path):
    audio_signer = AudioSigner()
    audio_signer.generate_keys()
    audio_signer.export_keys(
        signing_key_path=signing_key_path, verifying_key_path=verifying_key_path)

# Sign
def _main_sign(signing_key_path,input_path,output_path):
    audio_signer = AudioSigner()
    audio_signer.import_keys(signing_key_path=signing_key_path)
    audio_signer.sign(input_path, output_path)

# Verify
def _main_verify(keydata,input_path_v):
    audio_signer = AudioSigner()
    # audio_signer.import_keys(verifying_key_path=verifying_key_path)
    audio_signer.import_keys2(keydata=keydata)
    return audio_signer.verify(input_path_v)

#分別執行生成密鑰、簽名、驗證
# _main_generate_keys(signing_key_path,verifying_key_path)

# _main_sign(signing_key_path,input_path,output_path)

keydata="bOyVRUNqltOxrsWH2lo3vAVQEeZUnhWeM9OKtyFwBCs=" #使用者輸入公要驗證
input_path_verify="generate/test2.wav"
print(_main_verify(keydata,input_path_verify))


# input_path_verify="input_data/v.wav"

# _main_verify(verifying_key_path,input_path_verify)


#公鑰上傳資料庫、google sheet、網頁.. verifying_key_path






