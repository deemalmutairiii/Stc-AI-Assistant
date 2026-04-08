import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from telecom_assistant.prompt import SYSTEM_PROMPT
from telecom_assistant.data import PLANS


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

_client = None


def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Missing OPENAI_API_KEY")
        _client = OpenAI(api_key=api_key)
    return _client


def is_arabic(text: str) -> bool:
    return any("\u0600" <= c <= "\u06FF" for c in text)


def normalize(text: str) -> str:
    return text.strip().lower()


def is_greeting(text: str) -> bool:
    t = normalize(text)
    return t in {
        "hi", "hello", "hey",
        "هلا", "اهلا", "أهلا", "اهلين", "أهلين",
        "السلام عليكم", "مرحبا"
    }


def format_plans() -> str:
    return "\n".join(
        f"- {p['name']}: price={p['price']}, data={p['data']}, roaming={p['roaming']}"
        for p in PLANS
    )


def handle_company_question(message: str) -> str | None:
    msg = normalize(message)

    support_keywords = [
        "support", "customer", "help", "call", "contact",
        "customer support", "customer service", "support number",
        "helpline", "phone number",
        "خدمة", "خدمة العملاء", "الدعم", "رقم", "رقم خدمة العملاء",
        "اتواصل", "اتصل", "ابي رقم", "رقم stc"
    ]

    company_keywords = [
        "what is stc", "who is stc", "about stc", "tell me about stc",
        "وش هي stc", "وش stc", "من هي stc", "عرفني على stc", "وش تقدم stc"
    ]

    services_keywords = [
        "what services does stc provide", "stc services", "services of stc",
        "وش خدمات stc", "خدمات stc", "وش تقدم stc"
    ]

    app_keywords = [
        "mystc", "my stc", "تطبيق stc", "تطبيق mystc", "وش تطبيق stc"
    ]

    if any(k in msg for k in support_keywords):
        if is_arabic(message):
            return "تقدر تتواصل مع خدمة عملاء stc على 900 من شريحة stc، أو 0114555555 من أي شبكة أخرى."
        return "You can contact STC customer support at 900 from an STC line, or 0114555555 from other networks."

    if any(k in msg for k in company_keywords):
        if is_arabic(message):
            return "stc هي شركة اتصالات سعودية رائدة تقدم خدمات الجوال والإنترنت والخدمات الرقمية للأفراد والشركات."
        return "STC is a leading Saudi telecom company that provides mobile, internet, and digital services for individuals and businesses."

    if any(k in msg for k in services_keywords):
        if is_arabic(message):
            return "stc تقدم خدمات الجوال، الإنترنت، الباقات، الألياف، الحلول الرقمية، وخدمات للأفراد والشركات."
        return "STC provides mobile services, internet, plans, fiber, digital solutions, and services for both individuals and businesses."

    if any(k in msg for k in app_keywords):
        if is_arabic(message):
            return "تطبيق mystc يتيح لك إدارة الخط، دفع الفواتير، شحن الرصيد، ومتابعة الباقات والخدمات بسهولة."
        return "The mystc app lets you manage your line, pay bills, recharge, and track your plans and services easily."

    return None


def classify_user_message(message: str) -> dict:
    client = get_client()

    classification_prompt = f"""
Classify the user's latest telecom message.

Return ONLY valid JSON in this format:
{{
  "intent": "package_issue" | "internet_issue" | "plan_request" | "general_question" | "greeting" | "other",
  "needs_followup": true | false
}}

Rules:
- package_issue: package activation, renewal, package not working, package ended too fast
- internet_issue: slow internet, no internet, disconnecting, weak signal, coverage issue
- plan_request: asking for a plan recommendation
- general_question: factual question about STC/company/services
- greeting: hello/hi/etc

For plan_request:
- needs_followup = true if usage is unclear
- needs_followup = false if the user already mentioned travel, budget, heavy usage, or clear behavior

Message:
{message}
"""

    res = client.responses.create(
        model="gpt-4o",
        input=classification_prompt,
        max_output_tokens=100,
    )

    raw = res.output_text.strip()

    try:
        return json.loads(raw[raw.find("{"):raw.rfind("}") + 1])
    except Exception:
        return {"intent": "other", "needs_followup": False}


def generate(messages: list[dict], mode: str) -> str:
    client = get_client()
    last_msg = messages[-1]["content"]

    prompt = f"""
{SYSTEM_PROMPT}

Mode: {mode}

Latest user message:
{last_msg}

Available plans:
{format_plans()}

Instructions by mode:

- PACKAGE_ISSUE:
Help with package problems like activation, renewal, or package ending too fast.
Ask one short clarifying question only if needed.

- INTERNET_ISSUE:
Help with internet speed, disconnection, no internet, signal, or coverage issues.
Ask one short clarifying question only if needed.

- PLAN_FOLLOWUP:
Ask exactly one short question to understand the user's usage better.

- PLAN_RECOMMENDATION:
Recommend directly from the provided plans.
Be practical and concise.

- GENERAL:
Answer naturally and directly.

Rules:
- Match the user's language
- Be smart, natural, and helpful
- Do not say this is a demo
- Do not be generic
"""

    res = client.responses.create(
        model="gpt-4o",
        input=prompt,
        max_output_tokens=180,
    )

    return res.output_text.strip()


def get_assistant_reply(messages: list[dict]) -> str:
    last_msg = messages[-1]["content"]

    if is_greeting(last_msg):
        return "هلا، كيف أقدر أساعدك؟" if is_arabic(last_msg) else "Hi, how can I help you?"

    company_answer = handle_company_question(last_msg)
    if company_answer:
        return company_answer

    result = classify_user_message(last_msg)
    intent = result.get("intent", "other")
    followup = result.get("needs_followup", False)

    if intent == "package_issue":
        return generate(messages, "PACKAGE_ISSUE")

    if intent == "internet_issue":
        return generate(messages, "INTERNET_ISSUE")

    if intent == "plan_request":
        if followup:
            return generate(messages, "PLAN_FOLLOWUP")
        return generate(messages, "PLAN_RECOMMENDATION")

    if intent == "general_question":
        return generate(messages, "GENERAL")

    return generate(messages, "GENERAL")