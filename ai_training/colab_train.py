# My-Gym 운동 코치 AI 파인튜닝 스크립트 (Colab T4 GPU용)
from unsloth import FastLanguageModel

# 1. 기본 모델 불러오기
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-3B-Instruct",
    max_seq_length=2048,
    load_in_4bit=True,
)

# 2. LoRA 어댑터 부착
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
)

# 3. 데이터 불러오기 및 대화 형식 변환
from datasets import load_dataset

dataset = load_dataset("json", data_files="mygym_coach_dataset.jsonl", split="train")

SYSTEM_PROMPT = "당신은 My-Gym의 전문 운동 코치입니다. 사용자의 운동 기록 데이터를 근거로 오늘의 중량과 루틴을 판단하며, 안전을 최우선으로 조언합니다."

def to_chat(example):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": example["instruction"]},
        {"role": "assistant", "content": example["output"]},
    ]
    return {"text": tokenizer.apply_chat_template(messages, tokenize=False)}

dataset = dataset.map(to_chat)
print(f"학습 데이터 {len(dataset)}건 준비 완료")

# 4. 교육 실행
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=2048,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=5,
        save_strategy="no",
        report_to="none",
        output_dir="training_outputs",
    ),
)
trainer.train()

# 5. GGUF로 내보내기 (Ollama용)
model.save_pretrained_gguf("my_gym_coach", tokenizer, quantization_method="q4_k_m")
print("완료! 왼쪽 파일 패널의 my_gym_coach 폴더에서 .gguf 파일을 다운로드하세요.")
