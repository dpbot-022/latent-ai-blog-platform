import sys
from pathlib import Path
from sqlalchemy.orm import Session

# Add current path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import hash_password
from backend.app.models.user import User, UserRole
from backend.app.models.post import Post
from backend.app.models.comment import Comment
from backend.app.models.like import Like
from backend.app.models.audit_log import AuditLog

def seed_database(custom_engine=None, custom_session_maker=None):
    target_engine = custom_engine or engine
    target_session_maker = custom_session_maker or SessionLocal
    print("Initializing database tables...")
    Base.metadata.create_all(bind=target_engine)
    db: Session = target_session_maker()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains users. Skipping seed.")
            return

        print("Seeding production engineering authors and users...")
        
        # 1. Create Users
        admin_user = User(
            username="admin",
            email="admin@nexusai.io",
            hashed_password=hash_password("Admin@123"),
            full_name="Nexus System Administrator",
            bio="Platform administrator overseeing production data pipelines and cluster telemetry.",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            role=UserRole.ADMIN,
            is_verified=True
        )

        elena = User(
            username="dr_elena",
            email="elena.vance@nexusai.io",
            hashed_password=hash_password("Author@123"),
            full_name="Dr. Elena Vance",
            bio="Staff AI Research Engineer specializing in dense retrieval, RAG, and neuro-symbolic search.",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
            role=UserRole.AUTHOR,
            is_verified=True
        )

        marcus = User(
            username="marcus_chen",
            email="marcus.chen@nexusai.io",
            hashed_password=hash_password("Author@123"),
            full_name="Marcus Chen",
            bio="Principal GPU Systems Architect. Optimizing CUDA kernels, Triton compiler passes, and high-throughput LLM serving.",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
            role=UserRole.AUTHOR,
            is_verified=True
        )

        sarah = User(
            username="sarah_jenkins",
            email="sarah.j@nexusai.io",
            hashed_password=hash_password("Author@123"),
            full_name="Sarah Jenkins",
            bio="Lead Data Architect focusing on petabyte-scale lakehouses, Apache Iceberg, and distributed query engines.",
            avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
            role=UserRole.AUTHOR,
            is_verified=True
        )

        reader_user = User(
            username="alex_reader",
            email="alex.reader@example.com",
            hashed_password=hash_password("Reader@123"),
            full_name="Alex Mercer",
            bio="Data Platform Enthusiast and Senior ML Engineer.",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
            role=UserRole.READER,
            is_verified=True
        )

        # Unverified demo user to test first-time login OTP flow
        new_engineer = User(
            username="new_engineer",
            email="alex.chen@innovate.ai",
            hashed_password=hash_password("Engineer@123"),
            full_name="Alex Chen",
            bio="Staff ML Infrastructure Engineer exploring MLA kernels and Triton compiler optimization.",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
            role=UserRole.AUTHOR,
            is_verified=False
        )

        db.add_all([admin_user, elena, marcus, sarah, reader_user, new_engineer])
        db.commit()
        db.refresh(admin_user)
        db.refresh(elena)
        db.refresh(marcus)
        db.refresh(sarah)
        db.refresh(reader_user)
        db.refresh(new_engineer)

        print("Seeding 9 high-caliber Data Engineering & AI articles...")

        posts_data = [
            {
                "title": "Architecting Production RAG: Hybrid Search with BM25, ColBERT, and Dense HNSW",
                "slug": "architecting-production-rag-hybrid-search",
                "category": "Vector Search & RAG",
                "tags": "RAG,VectorDB,HybridSearch,ColBERT,Embeddings",
                "author_id": elena.id,
                "read_time_minutes": 8,
                "cover_image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "Pure dense vector search frequently fails on exact keyword identifiers and domain terminology. Here is how production teams implement multi-stage hybrid retrieval with Reciprocal Rank Fusion.",
                "content": """## The Reality of Naive Vector Search in Production

Many engineering teams begin their Retrieval-Augmented Generation (RAG) journey with a naive dense embedding retrieval pipeline: embed chunks with `text-embedding-3-small`, store them in a vector index using cosine distance, and retrieve top-k chunks.

In enterprise production environments, this simple architecture rapidly collapses when confronted with:
1. **Specific Alphanumeric Identifiers**: Model codes like `RTX-4090-OC` or ticket numbers `INC-98231` collapse into nondescript vector centroids.
2. **Vocabulary Mismatch & Polysemy**: Cross-domain jargon often yields high semantic cosine similarity despite having zero factual relevance.
3. **Information Loss from Pooling**: Mean-pooling dense embeddings across 512 tokens condenses subtle structural semantics into a single vector.

```
                    ┌────────────────────────┐
                    │      User Query        │
                    └───────────┬────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
       ┌──────────────────┐           ┌──────────────────┐
       │   BM25 / Sparse  │           │   Dense HNSW     │
       │ Lexical Matching │           │ Vector Distance  │
       └─────────┬────────┘           └────────┬─────────┘
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                    ┌────────────────────────┐
                    │ Reciprocal Rank Fusion │
                    │     (RRF Score)        │
                    └───────────┬────────────┘
                                ▼
                    ┌────────────────────────┐
                    │ ColBERT / Cross-Encoder│
                    │   Late-Interaction     │
                    └───────────┬────────────┘
                                ▼
                    ┌────────────────────────┐
                    │ Top-5 Synthesized Pass │
                    └────────────────────────┘
```

## Multi-Stage Hybrid Architecture

To overcome these failure modes, production-grade systems utilize a **multi-stage hybrid retrieval pipeline**:

### 1. Sparse Lexical Inverted Index (BM25 / SPLADE)
We maintain an inverted index with BM25 scoring for token-exact lexical recall. BM25 guarantees that rare terms, identifiers, and company names receive mathematically massive Inverse Document Frequency (IDF) weights:
$$IDF(q_i) = \\ln \\left( \\frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1 \\right)$$

### 2. Dense Vector Index (HNSW / ScaNN)
In parallel, an Approximate Nearest Neighbor (ANN) index matches abstract semantic intent, synonyms, and conversational queries.

### 3. Reciprocal Rank Fusion (RRF)
Rather than attempting to normalize disparate score ranges (cosine vs BM25 unbounded scores), we apply Reciprocal Rank Fusion across ranked candidate sets:
$$RRF\\_Score(d) = \\sum_{m \\in M} \\frac{1}{k + r_m(d)}$$
where $k$ is typically set to $60$, and $r_m(d)$ represents the ordinal rank of document $d$ in retrieval method $m$.

### 4. Late Interaction with ColBERT
Instead of squashing a whole document chunk into one vector, ColBERT stores token-level embeddings and computes maximum similarity (MaxSim) across query and document tokens:

```python
import torch

def late_interaction_score(query_embeddings, doc_embeddings):
    # query: [Q_len, D], doc: [D_len, D]
    sim_matrix = torch.matmul(query_embeddings, doc_embeddings.T) # [Q_len, D_len]
    maxsim_per_token, _ = sim_matrix.max(dim=-1) # [Q_len]
    return maxsim_per_token.sum().item()
```

## Production Latency Benchmarks

| Retrieval Strategy | Precision@5 | Latency (p95) | Infrastructure Footprint |
| :--- | :--- | :--- | :--- |
| Pure Dense (HNSW) | 68.2% | 18ms | High RAM (VRAM) |
| Pure Sparse (BM25) | 61.4% | 6ms | Low Disk/CPU |
| Hybrid RRF (BM25 + HNSW) | 84.7% | 24ms | Balanced |
| Hybrid + ColBERT Reranker | **92.3%** | **48ms** | Dedicated GPU Service |

## Key Takeaways for AI Engineers
- Never deploy single-vector retrieval to mission-critical customer workflows.
- Implement Reciprocal Rank Fusion as an unparameterized, calibration-free fusion layer.
- Deploy Cross-Encoder or ColBERT re-ranking only on the top-50 candidates to respect latency SLAs."""
            },
            {
                "title": "Ultra-Low Latency LLM Serving: Dissecting PagedAttention and Continuous Batching in vLLM",
                "slug": "ultra-low-latency-llm-serving-pagedattention-vllm",
                "category": "LLM Infrastructure",
                "tags": "vLLM,PagedAttention,ContinuousBatching,CUDA,Inference",
                "author_id": marcus.id,
                "read_time_minutes": 10,
                "cover_image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "Traditional LLM serving engines waste up to 70% of GPU memory on KV-cache fragmentation. We break down how PagedAttention and iteration-level scheduling achieve 4x throughput gains.",
                "content": """## The Bottleneck: Memory Bound Autoregressive Decoding

Large Language Model generation is fundamentally memory-bandwidth bound during token generation. For every output token generated, the model must read all previous Key-Value (KV) cache tensors from High Bandwidth Memory (HBM) into SRAM.

In naive serving frameworks (like HuggingFace Transformers baseline), GPU memory allocation for the KV-cache is allocated contiguously for the theoretical maximum context window (e.g., 4096 or 8192 tokens).

This causes three catastrophic inefficiencies:
1. **Internal Fragmentation**: A request generating 100 tokens occupies reservation slots for 4,096 tokens.
2. **External Fragmentation**: Memory gaps between completed requests prevent new incoming batches from fitting into VRAM.
3. **Zero Sharing**: Parallel sampling branches (e.g. beam search, multiple completions) duplicate KV vectors identically.

```
Traditional Contiguous Allocation (60-80% Wasted):
[ Token 1-100 ][          EMPTY RESERVED SLOTS (3,996 tokens)          ]

PagedAttention Virtual Block Mapping:
Physical Blocks in VRAM: [ Block 3 ][ Block 0 ][ Block 12 ][ Block 7 ]
Logical Request Stream:  Logical Block 0 -> Phys 3 | Logical Block 1 -> Phys 12
```

## PagedAttention: Operating System Virtual Memory for GPUs

Inspired by classic OS virtual memory paging, **PagedAttention** breaks down the continuous Key and Value tensors into discrete, fixed-size blocks (e.g., 16 or 32 tokens).

```python
# Conceptual Page Table Entry in vLLM
class BlockTable:
    def __init__(self, block_size: int = 16):
        self.block_size = block_size
        self.physical_block_ids: list[int] = []
        
    def append_slot(self, memory_manager):
        if not self.physical_block_ids or self.is_last_block_full():
            new_block_id = memory_manager.allocate_free_block()
            self.physical_block_ids.append(new_block_id)
```

During attention computation, the custom CUDA kernel translates logical token positions into physical block addresses on the fly using a per-request block table. Because blocks are small and dynamically allocated, waste drops from **>70% to under 4%**!

## Iteration-Level Continuous Batching

Traditional static batching processes a batch until the slowest, longest generation completes. Shorter sequences sit idle in GPU memory, burning compute cycles on padding tokens.

**Continuous Batching** (or iteration-level scheduling) evaluates the scheduler at each decoding step:
- When a request outputs an `<|endoftext|>` token, its memory blocks are immediately recycled.
- A new incoming request from the queue enters the active batch on the very next token iteration without waiting for the entire batch to finish.

## Production Tuning Checklist
1. **Block Size Selection**: Set block size to 16 for short prompt workloads and 32 for dense document summarization to balance kernel launch overhead with fragmentation.
2. **Tensor Parallelism**: When scaling across multiple A100/H100 GPUs with `tp_size=4` or `tp_size=8`, ensure NCCL communication links leverage NVLink; standard PCIe causes communication bottlenecks.
3. **Speculative Decoding**: Combine a small draft model (e.g. Llama-3.2-1B) with your target model (Llama-3.3-70B) to verify multiple tokens per step, cutting latency by 40-60%."""
            },
            {
                "title": "The Modern Lakehouse Architecture: Apache Iceberg ACID Transactions on Object Storage",
                "slug": "modern-lakehouse-architecture-apache-iceberg-acid",
                "category": "Lakehouse & Big Data",
                "tags": "ApacheIceberg,DataLakehouse,ObjectStorage,Parquet,DataEngineering",
                "author_id": sarah.id,
                "read_time_minutes": 9,
                "cover_image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "How open table formats like Apache Iceberg turn commodity S3/GCS object stores into enterprise ACID lakehouses, solving the concurrency and metadata bottlenecks of legacy Hive catalogs.",
                "content": """## Beyond the Hive Metastore

For over a decade, data lakes relied on the Apache Hive catalog model. Directory-based partitioning (`/year=2026/month=03/day=28/`) meant that querying a table required recursively listing hundreds of thousands of files across object storage.

On systems like Amazon S3 or Google Cloud Storage, listing millions of object keys is slow, expensive, and crucially: **non-atomic**.

If an ingestion job failed halfway, orphan files remained visible to downstream consumers, generating dirty reads, corrupt aggregations, and data integrity failures.

## Apache Iceberg: Metadata Architecture

Apache Iceberg decouples table structure from physical storage directories through a hierarchical, immutable metadata tree:

```
[ Iceberg Catalog ] ────────► Points to current metadata pointer
          │
          ▼
[ Iceberg Metadata File ] ──► (Schema, Partition Spec, Snapshot History)
          │
          ├──────────────┐
          ▼              ▼
[ Snapshot 1 ]     [ Snapshot 2 (Current) ]
          │              │
          ▼              ▼
[ Manifest List ]  [ Manifest List ]
          │              │
          ▼              ▼
[ Manifest File ]  [ Manifest File ]
          │              │
          ▼              ▼
[ Parquet Data ]   [ Parquet Data + Delete Files ]
```

### 1. Snapshot Isolation
Every commit (insert, delete, compact) creates a new immutable snapshot. Readers always read a consistent snapshot, eliminating dirty reads and enabling true **Time Travel** queries:

```sql
-- Read historical snapshot from 24 hours ago
SELECT * FROM production_lake.events
TIMESTAMP AS OF '2026-03-27 10:00:00.000000 UTC';
```

### 2. Hidden Partitioning
In legacy Hive, users had to remember the exact partition scheme and write fragile filter expressions:
`WHERE date >= '2026-03-01' AND date < '2026-04-01'`

With Iceberg, partitioning is a metadata transform function (e.g. `days(event_timestamp)` or `bucket(16, user_id)`). The user simply queries `WHERE event_timestamp >= '2026-03-01'` and Iceberg automatically prunes unneeded manifest files without leaking physical details.

### 3. Copy-on-Write vs Merge-on-Read
- **Copy-on-Write (CoW)**: High read throughput for append-heavy analytic workloads.
- **Merge-on-Read (MoR)**: Low-latency streaming updates where delta delete files are merged at query execution time.

## Recommended Production Compaction Strategy

Without maintenance, streaming writes create thousands of small 500KB files. We execute automated asynchronous compaction using Spark or Trino:

```sql
CALL lakehouse.system.rewrite_data_files(
  table => 'production_lake.telemetry_events',
  strategy => 'binpack',
  options => map('target-file-size-bytes', '536870912') -- 512 MB target
);
```

This guarantees sub-second query response times while keeping cloud storage costs minimal."""
            },
            {
                "title": "Real-Time Stream Processing at Scale: End-to-End Exactly-Once with Apache Flink & Kafka",
                "slug": "real-time-stream-processing-apache-flink-kafka",
                "category": "Stream Processing",
                "tags": "ApacheFlink,Kafka,StreamProcessing,EventDriven,ExactlyOnce",
                "author_id": sarah.id,
                "read_time_minutes": 11,
                "cover_image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "Achieving true exactly-once processing requires coordinated distributed snapshots and transactional two-phase commits. Here is how to configure Flink and Kafka for zero data loss.",
                "content": """## What Does Exactly-Once Really Mean?

In distributed event streaming, network partitions, worker failures, and consumer rebalances are guaranteed occurrences.
- **At-least-once**: Messages may be processed multiple times if an acknowledgment is lost.
- **At-most-once**: Messages may be dropped on crash.
- **Exactly-once (Effectively-Once)**: Even when failures occur, internal operator state reflects each event exactly once, and output sinks commit results transactionally.

## The Chandy-Lamport Distributed Snapshot Mechanism

Apache Flink does not pause the world to take state checkpoints. Instead, it injects special **Checkpoint Barrier** tokens into the input stream:

```
Stream: [ Event 4 ] [ Event 3 ] [ BARRIER N ] [ Event 2 ] [ Event 1 ] ──► [ Operator ]
```

When an operator receives `BARRIER N` from all input channels:
1. It pauses processing on those channels.
2. It writes its internal state (keyed state, RocksDB SST files) asynchronously to durable storage (e.g. S3/HDFS).
3. It emits `BARRIER N` downstream to subsequent operators.
4. It resumes streaming immediately while the background state upload finishes.

## Two-Phase Commit Sink Protocol

Flink's internal state correctness is only half the equation. If the destination Kafka topic or database writes duplicate events before a checkpoint is finalized, the outside world sees duplicate data.

Flink coordinates with Kafka using the **Two-Phase Commit (2PC)** sink:

```python
# Conceptual Kafka 2PC Lifecycle in Flink Sink
class FlinkKafkaTransactionalSink:
    def begin_transaction(self):
        # Generates transactional.id with checkpoint epoch
        self.producer.init_transactions()
        self.producer.begin_transaction()
        
    def pre_commit(self):
        # Flushes all buffered Kafka records; does NOT commit yet
        self.producer.flush()
        
    def commit(self):
        # Invoked ONLY when JobManager confirms all barriers reached persistent storage
        self.producer.commit_transaction()
        
    def abort(self):
        # Invoked if any stage crashed before checkpoint confirmation
        self.producer.abort_transaction()
```

## Production RocksDB State Backend Optimization
For large state (> 500GB), heap-based memory state causes uncontrollable JVM garbage collection pauses.
Configure Flink with **EmbeddedRocksDBStateBackend**:
- Enable incremental checkpointing (`state.backend.incremental: true`).
- Allocate 60% of container memory to off-heap native memory for RocksDB block cache.
- Enable bloom filters on high-cardinality state keys to eliminate unnecessary disk seeks."""
            },
            {
                "title": "Production Feature Stores: Bridging the Offline-Online Skew with Feast and Redis",
                "slug": "production-feature-stores-feast-redis-skew",
                "category": "MLOps & Platform",
                "tags": "FeatureStore,Feast,Redis,DataSkew,MLOps",
                "author_id": elena.id,
                "read_time_minutes": 7,
                "cover_image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "Training-serving skew is the silent killer of ML models in production. Learn how to centralize feature definitions, guarantee point-in-time correctness, and achieve sub-5ms Redis lookups.",
                "content": """## The Silent Failure: Training-Serving Skew

Machine Learning models rarely fail with runtime exceptions in production. Instead, they fail silently: predictive accuracy tanks because features fed to the model during real-time inference differ subtly from how they were computed during historical training.

### Two Common Root Causes:
1. **Data Leakage in Historical Joins**: Joining customer features using `WHERE event_timestamp <= CURRENT_TIMESTAMP` incorporates future events that would not have been available at the moment of prediction.
2. **Implementation Drift**: Data scientists write feature logic in pandas/SQL for training, while backend engineers re-implement the same logic in Python/Go/Java for the production REST API.

## The Dual-Store Architecture

An enterprise feature store acts as a single source of truth with two synchronized storage engines:

```
[ Raw Event Logs / Warehouse ] ────────► [ Feast Feature Registry ]
               │                                      │
               ├──────────────────────────────────────┤
               ▼                                      ▼
      [ Offline Store ]                      [ Online Store ]
     (Snowflake / BigQuery / Parquet)             (Redis Cluster / DynamoDB)
               │                                      │
   Point-in-time Historical Joins              Sub-5ms Low Latency Lookups
               │                                      │
               ▼                                      ▼
      [ Model Training ]                     [ Real-Time Inference ]
```

## Point-in-Time Correctness with Feast

Feast implements an "AS-OF" point-in-time join that guarantees historical correctness:

```python
from feast import FeatureStore
import pandas as pd

store = FeatureStore(repo_path="./feature_repository")

# Training observation dataframe with entity keys and observation timestamps
entity_df = pd.DataFrame.from_dict({
    "user_id": [1024, 2048, 4096],
    "timestamp": [
        pd.Timestamp("2026-01-15 14:00:00", tz="UTC"),
        pd.Timestamp("2026-02-01 09:30:00", tz="UTC"),
        pd.Timestamp("2026-03-20 18:15:00", tz="UTC")
    ]
})

training_data = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "user_activity_stats:30d_transaction_count",
        "user_activity_stats:avg_order_value",
        "user_risk_profile:fraud_risk_score"
    ]
).to_df()
```

## Online Retrieval in Production Service

At inference time, our FastAPI recommendation service queries Redis using primary entity keys:

```python
features = store.get_online_features(
    features=[
        "user_activity_stats:30d_transaction_count",
        "user_activity_stats:avg_order_value"
    ],
    entity_rows=[{"user_id": 1024}]
).to_dict()
# Returns dictionary in ~2.8ms p99 latency
```

This ensures identical feature schemas, identical missing value imputations, and zero training-serving skew."""
            },
            {
                "title": "Data Contracts & Schema Evolution: Enforcing Reliable Pipelines with Protobuf",
                "slug": "data-contracts-schema-evolution-protobuf",
                "category": "Data Engineering",
                "tags": "DataContracts,Protobuf,SchemaEvolution,DataQuality,CICD",
                "author_id": sarah.id,
                "read_time_minutes": 8,
                "cover_image": "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "Upstream engineers modifying an application database column should not crash downstream analytics dashboards. Enforcing formal Data Contracts shifts testing left.",
                "content": """## The Broken Trust in Modern Data Pipelines

In traditional web architectures, the data team extracts data via Change Data Capture (CDC) directly from the application's transactional database (PostgreSQL/MySQL).

The inevitable disaster happens:
A frontend engineer renames `user_status` to `account_state` or drops an unused table column. The operational app functions fine, but downstream dbt models, Airflow DAGs, and revenue reporting dashboards explode silently.

## What is a Data Contract?

A **Data Contract** is an explicit, versioned agreement between data producers and data consumers specifying:
1. **Schema Definition**: Exact field names, types, and nullability.
2. **Semantic Meaning**: Business definitions of values.
3. **Quality Guarantees (SLAs)**: Freshness, allowed percentage of nulls, and value ranges.
4. **Change Management Process**: Breaking changes require deprecation windows and major version bumps.

```protobuf
syntax = "proto3";

package commerce.events.v1;

message OrderPlaced {
  string order_id = 1;
  int64 user_id = 2;
  double total_amount_cents = 3;
  string currency = 4;
  int64 timestamp_epoch_ms = 5;
  
  // Tag 6 is reserved for future schema evolution; NEVER re-use tag numbers!
  reserved 6;
  reserved "discount_code";
}
```

## Automated CI/CD Contract Enforcement

We shift data validation left by embedding contract checks into pull request pipelines:

```yaml
# .github/workflows/data_contract_check.yml
name: Schema Evolution Gate
on: [pull_request]
jobs:
  validate-schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Buf Breaking Change Detection
        uses: bufbuild/buf-breaking-action@v1
        with:
          against: 'https://github.com/org/contracts.git#branch=main'
```

If an engineer introduces a breaking change (such as deleting an active field without a deprecation cycle), the CI build fails immediately, preventing corrupted payloads from entering the production data stream."""
            },
            {
                "title": "Post-Training Quantization in Production: A Comparative Study of AWQ, GPTQ, and FP8",
                "slug": "post-training-quantization-awq-gptq-fp8",
                "category": "Model Optimization",
                "tags": "Quantization,AWQ,GPTQ,FP8,LLMPerformance",
                "author_id": marcus.id,
                "read_time_minutes": 9,
                "cover_image": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "Deploying 70B parameter models on single GPU instances requires intelligent precision reduction. Here is how AWQ, GPTQ, and native FP8 compare in latency, VRAM, and perplexity.",
                "content": """## Why 16-Bit Inference is Economically Unsustainable

A standard FP16 (16-bit float) model requires approximately **2 bytes of VRAM per parameter**.
- A 70-Billion parameter model demands 140 GB of GPU memory *just for model weights*, plus an additional 30-50 GB for the KV-cache.
- This forces deployment onto multi-GPU clusters ($4x A100 80GB$ or $8x A100$), driving infrastructure expenses through the roof.

**Post-Training Quantization (PTQ)** maps continuous 16-bit floating point numbers to low-bit integer representations (INT4 or INT8) without retraining the base model from scratch.

## 1. GPTQ (Generalized Post-Training Quantization)
GPTQ computes a second-order Taylor expansion over calibration dataset activations. It uses the inverse Hessian matrix to sequentially update remaining unquantized weights, compensating for rounding errors introduced during 4-bit conversion:

$$\\Delta w = -\\frac{w_q - w}{[H^{-1}]_{qq}} H^{-1}_{:,q}$$

- **Strength**: High perplexity retention on dense benchmarks.
- **Drawback**: Can introduce latency overhead during decompression on modern tensor cores.

## 2. AWQ (Activation-aware Weight Quantization)
AWQ observes that **not all weights are equally important**. Less than 1% of weight channels (the "salient weights") correspond to huge activation outliers.

Instead of keeping them in FP16 (which complicates matrix multiplication kernels), AWQ applies a per-channel protection scale:

```python
# Conceptual AWQ per-channel scaling
def protect_salient_channels(weights, activations):
    # Identify channels with largest activation magnitudes
    saliency = activations.abs().mean(dim=0)
    scale = saliency.pow(0.5)
    
    # Scale weights up before INT4 rounding, scale activations down
    scaled_weights = weights * scale
    quantized_weights = round_to_int4(scaled_weights)
    return quantized_weights, scale
```

Because AWQ leaves activations in normal INT4/FP16 layouts, custom GEMM kernels achieve blistering speedups in vLLM.

## 3. Native FP8 Kernels (Nvidia Ada Lovelace & Hopper)
On modern H100 and RTX 4090 GPUs, native Tensor Cores support direct hardware FP8 (E4M3 and E5M2 formats):
- **Zero Dequantization Overhead**: Matmul operations run directly in 8-bit registers.
- **Almost 0% Perplexity Degradation**: Unlike 4-bit, 8-bit floating point retains dynamic range for extreme token values.

## Empirical Benchmark Matrix (Llama-3-70B)

| Method | Bit Precision | VRAM Footprint | Token/s Throughput | MMLU Score |
| :--- | :--- | :--- | :--- | :--- |
| Baseline FP16 | 16-bit | 142 GB | 18.4 tok/s | 79.5% |
| GPTQ | INT4 | **38 GB** | 42.1 tok/s | 78.4% |
| AWQ | INT4 | **39 GB** | **49.8 tok/s** | 78.7% |
| Native FP8 | 8-bit | 72 GB | **61.2 tok/s** | **79.4%** |

## Recommendation for Production
- For memory-constrained single-GPU deployments (e.g. 1x A100 40GB or 1x RTX 4090), choose **AWQ INT4**.
- For maximum throughput on H100 clusters with large concurrent batches, choose **Native FP8**."""
            },
            {
                "title": "Observability for Autonomous AI Agents: OpenTelemetry Tracing, Evaluation, and Cost Guardrails",
                "slug": "observability-autonomous-ai-agents-opentelemetry",
                "category": "AI Ops & Observability",
                "tags": "AgenticAI,OpenTelemetry,Tracing,EvalMetrics,CostControl",
                "author_id": elena.id,
                "read_time_minutes": 10,
                "cover_image": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "When AI agents loop autonomously across external tools and search APIs, traditional APM fails. Here is how to trace multi-turn reasoning, calculate RAGAS metrics, and prevent budget runaway.",
                "content": """## The Non-Deterministic Nature of Autonomous Agent Loops

Standard software requests follow deterministic call stacks. In contrast, an autonomous AI Agent executing ReAct (Reasoning + Acting) loops can spawn:
- Arbitrary numbers of recursive LLM inferences
- Dynamic tool invocations (database queries, code sandboxes, web crawlers)
- Non-deterministic branching paths based on intermediate model hallucination

Without granular observability, when an agent fails to solve a task, engineers have zero visibility into whether the failure stemmed from:
1. Retrieval failure (poor context)
2. Tool execution error (bad arguments generated by the model)
3. Prompt drift or reasoning loop degeneration

```
[ User Prompt ]
      │
      ▼
[ Agent Controller Span ] ─────────────────────────────────────────┐
      │                                                           │
      ├───────────────────────┬──────────────────────┐            │
      ▼                       ▼                      ▼            ▼
[ LLM Step 1: Think ]   [ Tool Call: SQL ]     [ LLM Step 2 ]  [ Total Cost ]
 (Prompt & Token Spans)  (Params & Duration)    (Final Answer)  ($0.042 USD)
```

## OpenTelemetry Semantic Conventions for GenAI

We standardize AI agent traces using OpenTelemetry Spans:

```python
from opentelemetry import trace

tracer = trace.get_tracer("nexusai.agent.tracer")

def execute_agent_tool_step(tool_name: str, arguments: dict):
    with tracer.start_as_current_span(f"gen_ai.tool.{tool_name}") as span:
        span.set_attribute("gen_ai.system", "gemini-flash")
        span.set_attribute("gen_ai.tool.name", tool_name)
        span.set_attribute("gen_ai.tool.arguments", str(arguments))
        
        try:
            result = run_sandbox_tool(tool_name, arguments)
            span.set_attribute("gen_ai.tool.status", "ok")
            return result
        except Exception as e:
            span.record_exception(e)
            span.set_attribute("gen_ai.tool.status", "error")
            raise
```

## Continuous Evaluation with RAGAS Metrics
Log-based metrics alone are insufficient; you must evaluate semantic output quality continuously:
- **Faithfulness**: Are all claims made in the output supported by the retrieved context?
- **Answer Relevance**: Did the agent actually address the original user intent?
- **Context Precision**: What fraction of retrieved context was utilized in the reasoning step?

## Automated Cost and Loop Guardrails

To prevent runaway agent loops from exhausting API budgets:
1. **Hard Max-Turn Thresholds**: Never allow an agent to iterate more than 10 turns without explicit human-in-the-loop authorization.
2. **Token Budget Leaky Bucket**: Set maximum cost allowances (e.g. $0.25 per user session). If exceeded, trigger a graceful circuit breaker and return a fallback explanation to the client."""
            },
            {
                "title": "DeepSeek-V3 Architecture: Multi-Head Latent Attention (MLA) Deep Dive",
                "slug": "deepseek-v3-multi-head-latent-attention-mla",
                "category": "LLM Infrastructure",
                "tags": "DeepSeek,MLA,KVCache,Transformers,Inference",
                "author_id": marcus.id,
                "read_time_minutes": 11,
                "cover_image": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
                "excerpt": "How DeepSeek-V3 compresses the KV-cache by over 93% using low-rank latent joint compression and decoupled RoPE. An in-depth mathematical dissection, architectural comparison with GQA, and Triton implementation.",
                "content": """## The Severe Memory Wall of LLM Context Windows

In frontier Large Language Model inference, the memory bandwidth required to fetch Key-Value (KV) cache tensors during autoregressive token generation dwarfs actual matrix multiplication compute.

Consider a 67B parameter model operating across a 128,000 token context window with standard Multi-Head Attention (MHA):
- Number of layers: L = 60
- Hidden dimension: d_model = 8192
- Number of heads: N_h = 64, Head dimension: d_h = 128
- Cache size per token: 2 * L * N_h * d_h * 2 bytes (FP16) = 1.96 MB per token

Across a 128k context sequence, the KV cache alone consumes **over 250 GB of VRAM per concurrent stream**! Even Grouped-Query Attention (GQA) with 8 key-value groups consumes over 31 GB per stream, severely choking multi-tenant serving concurrency.

```
MHA (Standard):
[ Key Head 1 .. 64 ][ Value Head 1 .. 64 ]  --> 100% Memory Footprint

GQA (Llama-3):
[ Key Group 1 .. 8  ][ Value Group 1 .. 8  ]  --> 12.5% Memory Footprint

DeepSeek MLA (Multi-Head Latent Attention):
[ Single Compressed Latent Vector c_t^{KV} ]  --> 6.8% Memory Footprint!
       + Decoupled Positional RoPE k_t^R
```

## Mathematical Foundations of Multi-Head Latent Attention (MLA)

Multi-Head Latent Attention (MLA) abandons the caching of independent Key and Value projection heads entirely. Instead, it compresses the Key and Value representations into a single **low-rank latent vector**:

### 1. Joint Low-Rank Key-Value Compression
During generation, token representation h_t is projected into a compact latent vector c_t^{KV} in R^{d_c} where latent dimension d_c = 512:

c_t^{KV} = W^{DKV} h_t

where W^{DKV} is the down-projection matrix.

Only this compressed vector c_t^{KV} is persisted in the GPU KV-cache!

### 2. Up-Projection During Attention Execution
During the attention kernel computation, keys and values are dynamically reconstructed on SRAM:

k_t^C = W^{UK} c_t^{KV}
v_t^C = W^{UV} c_t^{KV}

### 3. Decoupled Rotary Position Embedding (RoPE)
A critical innovation in MLA is how it resolves Rotary Position Embedding (RoPE). Standard RoPE cannot be directly multiplied into an up-projected matrix without losing associative efficiency.

DeepSeek decouples positional information into a separate low-dimensional key vector k_t^R in R^{d_r} (where d_r = 64):

k_t^R = RoPE(W^{KR} h_t)
q_t^R = RoPE(W^{QR} c_t^Q)

The final attention query and key vectors are concatenated:
q_{t, i} = [q_{t, i}^C; q_{t, i}^R]
k_{t, i} = [k_{t, i}^C; k_{t, i}^R]

Because k_t^R is shared across all attention heads and has a small dimension (64), caching both c_t^{KV} and k_t^R requires merely:
512 + 64 = 576 scalar elements per token

Compare this to standard MHA (64 * 128 * 2 = 16,384 elements per token). **MLA achieves a 96.5% reduction in KV-cache footprint!**

## Triton Kernel Implementation

Below is a production-optimized PyTorch and Triton kernel implementation demonstrating the low-rank projection and decoupled RoPE computation:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MultiHeadLatentAttention(nn.Module):
    def __init__(self, d_model=4096, n_heads=32, d_head=128, d_latent_kv=512, d_rope=64):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_head = d_head
        self.d_latent_kv = d_latent_kv
        self.d_rope = d_rope
        
        # KV Down-Projection
        self.W_DKV = nn.Linear(d_model, d_latent_kv, bias=False)
        # KV Up-Projections
        self.W_UK = nn.Linear(d_latent_kv, n_heads * d_head, bias=False)
        self.W_UV = nn.Linear(d_latent_kv, n_heads * d_head, bias=False)
        
        # Decoupled RoPE Projections
        self.W_KR = nn.Linear(d_model, d_rope, bias=False)
        self.W_Q = nn.Linear(d_model, n_heads * (d_head + d_rope), bias=False)
        
    def forward(self, x, kv_cache=None):
        batch, seq_len, _ = x.shape
        
        # 1. Compress KV into latent representation
        c_kv = self.W_DKV(x) # [Batch, Seq, 512]
        k_rope = self.apply_rope(self.W_KR(x)) # [Batch, Seq, 64]
        
        # 2. Store only compressed latent in KV Cache
        # Cache memory: 576 floats per token instead of 8192!
        if kv_cache is not None:
            c_kv, k_rope = kv_cache.update(c_kv, k_rope)
            
        # 3. Dynamic Matrix Absorption during inference
        # W_UK can be absorbed into Query weights: Q_eff = Q @ W_UK
        keys = self.W_UK(c_kv).view(batch, -1, self.n_heads, self.d_head)
        values = self.W_UV(c_kv).view(batch, -1, self.n_heads, self.d_head)
        
        return keys, values
```

## Benchmarks & Takeaways

| Architecture | Model Size | Context | KV Cache / Stream | Peak Batch Size (8x H100) |
| :--- | :--- | :--- | :--- | :--- |
| MHA Baseline | 67B | 32k | 64.0 GB | 12 reqs |
| GQA (Llama-3) | 70B | 32k | 8.0 GB | 96 reqs |
| **MLA (DeepSeek-V3)** | **67B** | **32k** | **2.2 GB** | **348 reqs (3.6x GQA)** |

### Engineering Guidelines
- **Deploy MLA for Large Contexts (>16k tokens)**: The KV cache compression yields direct linear gains in maximum batch size and throughput.
- **Absorb Up-Projection Weights**: During inference, mathematically absorb W^{UK} directly into the Query projection matrix W^Q prior to kernel launch to eliminate one matrix multiplication step.
- **Pair with Chunked Prefill**: Pair MLA with continuous iteration scheduling (vLLM style) to maintain SLA parity across mixed prefill and decode phases."""
            }
        ]

        created_posts = []
        for p_data in posts_data:
            post = Post(**p_data)
            db.add(post)
            created_posts.append(post)

        db.commit()
        for p in created_posts:
            db.refresh(p)

        print("Seeding initial comments, likes, and audit records...")

        # Comments
        comments_data = [
            (created_posts[0].id, marcus.id, "Phenomenal deep dive, Elena. The Reciprocal Rank Fusion formula explanation cleared up a huge misconception our team had regarding score calibration."),
            (created_posts[0].id, reader_user.id, "We implemented late interaction with ColBERT last month in our enterprise search and saw precision jump by nearly 25%! Great write-up."),
            (created_posts[1].id, elena.id, "The GPU memory fragmentation breakdown is so clean. Continuous batching was a game-changer when we switched our cluster to vLLM."),
            (created_posts[2].id, marcus.id, "Hidden partitioning in Iceberg completely saved our analytics team from broken partition queries. Excellent production advice on compaction."),
            (created_posts[3].id, reader_user.id, "Two-phase commit with Kafka is notoriously tricky to get right. This diagram and step-by-step lifecycle is bookmarked."),
            (created_posts[4].id, sarah.id, "Training-serving skew has caused so many silent production outages. The dual-store Redis architecture is mandatory for any serious ML team."),
            (created_posts[6].id, elena.id, "AWQ INT4 is our default for all edge and single-GPU deployments now. The perplexity preservation on 70B models is unbelievable."),
            (created_posts[7].id, sarah.id, "The OpenTelemetry semantic conventions for tools and token tracking are must-haves. Great point on hard max-turn thresholds."),
            (created_posts[8].id, elena.id, "The matrix absorption trick during inference is brilliant. That alone saves an entire memory round-trip to High Bandwidth Memory."),
            (created_posts[8].id, reader_user.id, "We were struggling with KV-cache OOM on 64k sequences with Llama-70B. MLA is clearly the future of long-context inference architectures.")
        ]

        for post_id, author_id, content in comments_data:
            c = Comment(post_id=post_id, author_id=author_id, content=content)
            db.add(c)

        # Likes
        likes_data = [
            (created_posts[0].id, marcus.id),
            (created_posts[0].id, reader_user.id),
            (created_posts[0].id, sarah.id),
            (created_posts[1].id, elena.id),
            (created_posts[1].id, reader_user.id),
            (created_posts[2].id, marcus.id),
            (created_posts[2].id, elena.id),
            (created_posts[3].id, reader_user.id),
            (created_posts[4].id, sarah.id),
            (created_posts[5].id, elena.id),
            (created_posts[6].id, marcus.id),
            (created_posts[6].id, reader_user.id),
            (created_posts[7].id, sarah.id),
            (created_posts[7].id, marcus.id),
            (created_posts[8].id, admin_user.id),
            (created_posts[8].id, elena.id),
            (created_posts[8].id, sarah.id),
            (created_posts[8].id, reader_user.id),
        ]

        for post_id, user_id in likes_data:
            l = Like(post_id=post_id, user_id=user_id)
            db.add(l)

        # Audit Logs
        db.add(AuditLog(
            action="SYSTEM_INIT",
            username="system",
            details="Database populated with 9 production engineering articles and seed users"
        ))

        db.commit()
        print("Database successfully seeded with 8 professional articles, users, comments, and likes!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
