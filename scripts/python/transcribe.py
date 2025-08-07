# https://github.com/openai/whisper/discussions/734
import typing
import os
import asyncio
import subprocess
import sys
import shlex
import whisper
import ssl

# Disable SSL verification globally (temporary fix for development)
if os.getenv("PY_ENV") == "true":
    ssl._create_default_https_context = ssl._create_unverified_context

def get_path_without_extension(filepath: str) -> str:
    path, _ = os.path.splitext(filepath)
    return path

# https://gist.github.com/liangfu/97f877e311210fa0ae18a31fdd92982e
async def convert_video_file_to_audio_file(video_path: str, audio_path: str) -> str:
    # print('Converting video files to audio files...', file=sys.stderr)
    try:
        command = shlex.split(f'ffmpeg -i {video_path} -vn -acodec libmp3lame -q:a 2 {audio_path} -y') # strip audio from video- less cpu intense
        subprocess.run(command, check=True)
        # print(f"Audio extracted successfully to {audio_path}", file=sys.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while extracting audio: {e}", file=sys.stderr)


# https://github.com/openai/whisper
async def extract_text_from_audio(audioFilePath: str) -> str:
    # print('Transcribing audio...', file=sys.stderr)
    model = whisper.load_model("base")
    result = model.transcribe(audioFilePath)
    print(f"{result['text']}", file=sys.stdout)


async def remove_files(filepaths: typing.List[str]) -> None:
    for filepath in filepaths:
        if os.path.isfile(filepath):
            # print(f'Removing file: {filepath}', file=sys.stderr)
            os.remove(filepath)


async def main() -> None:
    # print(f'Transcribing video for user: {user_id}', file=sys.stderr)
    # Extract audio from video
    async_vta = [convert_video_file_to_audio_file(video_save_paths[i], audio_save_paths[i]) for i in range(len(video_save_paths))]
    await asyncio.gather(*async_vta)
    # Transcribe audio
    async_extract_text = [extract_text_from_audio(audio_path) for audio_path in audio_save_paths]
    await asyncio.gather(*async_extract_text)
    # Delete files
    video_save_paths.extend(audio_save_paths)
    await remove_files(video_save_paths)
    exit(0)


if __name__ == '__main__':
    args: typing.List[str] = sys.argv[1:]
    if not len(args) == 2:
        print('ERROR: Scripts requires first agument (user Id) and second argument (video)', file=sys.stderr)
        exit(1)
    user_id: str = args[0]
    video_save_paths: typing.List[str] = args[1].split(',')
    audio_save_paths: typing.List[str] = [f'{get_path_without_extension(video_save_paths[i])}_{i}.mp3' for i in range(len(video_save_paths))]
    try:
        asyncio.run(main())
    except Exception as e:
        print(f'Error occurred attempting to transcribe audio: {e}', file=sys.stderr)