"""
Whisper Voice Detection and Transcription Service.
Uses faster-whisper (CTranslate2) for high-performance, local speech-to-text.
Works 100% offline and locally without third-party cloud API dependencies.
"""
import os
import tempfile
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Patch PyAV 19+ open compatibility for faster-whisper
try:
    import av
    _orig_av_open = av.open
    def _safe_av_open(*args, **kwargs):
        kwargs.pop("metadata_errors", None)
        return _orig_av_open(*args, **kwargs)
    av.open = _safe_av_open
except Exception as patch_err:
    logger.debug(f"PyAV patch skipped: {patch_err}")

_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            logger.info("Initializing faster-whisper model (tiny.en, int8)...")
            _whisper_model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
            logger.info("Whisper model initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Whisper model: {e}")
            raise e
    return _whisper_model

def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.webm", language: Optional[str] = "en") -> dict:
    """
    Transcribes raw audio bytes into clean natural language text.
    Supports WebM, WAV, MP4, MP3, OGG, etc.
    """
    if not audio_bytes or len(audio_bytes) < 100:
        return {
            "success": False,
            "text": "",
            "error": "Audio recording is empty or too short."
        }

    suffix = os.path.splitext(filename)[1] or ".webm"
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name

        model = get_whisper_model()
        segments, info = model.transcribe(
            temp_path,
            beam_size=5,
            language=language if language and language != "auto" else None,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        transcript_parts = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                transcript_parts.append(text)

        full_transcript = " ".join(transcript_parts).strip()
        logger.info(f"Whisper transcription result: '{full_transcript}' (detected lang: {info.language}, prob: {info.language_probability:.2f})")

        return {
            "success": True,
            "text": full_transcript,
            "language": info.language,
            "duration": round(info.duration, 2),
            "confidence": round(info.language_probability, 2)
        }
    except Exception as err:
        logger.error(f"Error during Whisper transcription: {err}", exc_info=True)
        return {
            "success": False,
            "text": "",
            "error": str(err)
        }
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
