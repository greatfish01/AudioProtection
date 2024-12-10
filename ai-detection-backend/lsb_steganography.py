# https://github.com/felixlimanta/eddsa-lossless-audio-signer/blob/master/lsb_steganography.py
import sys
import os

####################################
# 手動指定 FFmpeg 的環境變數
os.environ["FFMPEG_BINARY"] = r"C:\ffmpeg\ffmpeg-7.1-essentials_build\bin\ffmpeg.exe"
from pydub import AudioSegment
AudioSegment.ffmpeg = "C:/ffmpeg/ffmpeg-7.1-essentials_build/bin/ffmpeg.exe"
###################################

class AudioLSB:
    mask = bytes([128, 64, 32, 16, 8, 4, 2, 1])

    def __init__(self, input_path):
        extension = input_path.split(".")[-1]
        self.input_audio = AudioSegment.from_file(input_path, format=extension)
        self.audio_data = bytearray(self.input_audio.raw_data)
        self.endianness = (sys.byteorder == 'big')
        self.sample_width = self.input_audio.sample_width

    def export(self, output_path):
        extension = output_path.split(".")[-1]
        output_audio = AudioSegment(
            data=bytes(self.audio_data),
            sample_width=self.sample_width,
            channels=self.input_audio.channels,
            frame_rate=self.input_audio.frame_rate
        )
        output_audio.export(output_path, format=extension)

    def encode(self, message):
        message_size = len(message)

        for i in range(0, message_size):
            base_index = i * 8 * self.sample_width
            if self.endianness:
                base_index += self.sample_width - 1

            for j in range(0, 8):
                audio_index = base_index + j * self.sample_width

                if message[i] & 1 << (7 - j):
                    self.audio_data[audio_index] = self.setLSB(
                        self.audio_data[audio_index])
                else:
                    self.audio_data[audio_index] = self.clearLSB(
                        self.audio_data[audio_index])

            if i == message_size - 1:
                for j in range(8, 16):
                    audio_index = base_index + j * self.sample_width
                    self.audio_data[audio_index] = self.clearLSB(
                        self.audio_data[audio_index])

    def decode(self, length=None):
        message = bytearray(b'')
        audio_length = len(self.audio_data)

        start_index = 0
        if self.endianness:
            start_index = self.sample_width - 1

        end_index = audio_length
        if length is not None:
            end_index = start_index + 8 * self.sample_width * length

        for i in range(start_index, end_index, 8 * self.sample_width):
            b = 0

            for j in range(0, 8 * self.sample_width, self.sample_width):
                b = b << 1

                if self.audio_data[i + j] & 1 == 1:
                    b = self.setLSB(b)
                else:
                    b = self.clearLSB(b)

            if length is None and b == 0:
                break

            message.append(b)

        return bytes(message)

    def setLSB(self, val):
        return val | 1

    def clearLSB(self, val):
        return val & ~(1)


def _main_encode(args):
    audio_lsb = AudioLSB(args.input_path)
    audio_lsb.encode(args.message.encode('utf-8'))
    audio_lsb.export(args.output_path)


def _main_decode(args):
    audio_lsb = AudioLSB(args.input_path)
    print(audio_lsb.decode(length=None).decode('utf-8'))


