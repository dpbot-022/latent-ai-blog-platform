import asyncio
import logging
from typing import Optional, Dict, Any, List
import httpx

logger = logging.getLogger(__name__)

class ExternalAIService:
    """
    Demonstrates Production-Grade External API Integration (Day 2 Curriculum):
    - Configurable timeouts
    - Exponential backoff retries
    - Request/Response data mapping
    - Resilient fallback handling
    """
    DEFAULT_TIMEOUT = 5.0  # seconds
    MAX_RETRIES = 3

    @classmethod
    async def analyze_article_content(cls, title: str, content: str) -> Dict[str, Any]:
        """
        Simulates an external LLM / NLP API call (e.g. OpenAI/Gemini/HuggingFace)
        with timeout, exponential retry, and data mapping.
        """
        words = content.split()
        word_count = len(words)
        
        # Simulated payload for external API
        payload = {
            "title": title,
            "sample_text": " ".join(words[:150]),
            "word_count": word_count,
            "task": "summarize_and_tag"
        }

        # Resilient execution with retry logic
        for attempt in range(1, cls.MAX_RETRIES + 1):
            try:
                # In production, this calls the external provider endpoint via raw HTTP or SDK
                # Here we perform an async non-blocking simulated external call
                await asyncio.sleep(0.05)  # Simulate network latency

                # Extract top technical keywords
                suggested_tags = cls._extract_keywords(content)
                summary = f"Synthesizes key concepts of '{title}' focusing on architecture, trade-offs, and scalability."
                
                return {
                    "provider": "Mock-NexusAI-Inference-Engine-v2",
                    "status": "success",
                    "attempt": attempt,
                    "generated_summary": summary,
                    "suggested_tags": suggested_tags,
                    "sentiment_score": 0.94,
                    "complexity_grade": "Graduate/Production Engineering"
                }
            except (httpx.RequestError, httpx.TimeoutException, Exception) as exc:
                logger.warning(f"External API attempt {attempt} failed: {exc}")
                if attempt == cls.MAX_RETRIES:
                    # Graceful degradation fallback
                    return {
                        "provider": "Fallback-Local-Heuristic",
                        "status": "degraded",
                        "generated_summary": title,
                        "suggested_tags": ["AI", "Engineering"],
                        "complexity_grade": "Standard"
                    }
                await asyncio.sleep(0.2 * (2 ** attempt))  # Exponential backoff

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        common_tech = [
            "RAG", "Embeddings", "Vector DB", "vLLM", "PagedAttention", "CUDA",
            "Apache Iceberg", "Parquet", "Flink", "Kafka", "Stream Processing",
            "Feast", "Redis", "Protobuf", "Great Expectations", "AWQ", "GPTQ",
            "FP8", "OpenTelemetry", "Tracing", "Latency", "Throughput"
        ]
        found = [word for word in common_tech if word.lower() in text.lower()]
        return found[:5] if found else ["AI", "Production", "Architecture"]
