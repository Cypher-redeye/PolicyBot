export const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Hindi",
  "Tamil",
  "Telugu"
];

export const translations = {
  English: {
    greeting: "Hello! I am PolicyBot. Ask me any question regarding your corporate policies, security guidelines, or operational manuals.",
    placeholder: "Ask a question (e.g. 'What is our data privacy policy?')",
    clearChat: "Clear Chat",
    chatAssistant: "Chat Assistant",
    chatSubtitle: "Ask questions about your company policies and get instant answers."
  },
  Spanish: {
    greeting: "¡Hola! Soy PolicyBot. Hazme cualquier pregunta sobre las políticas corporativas, pautas de seguridad o manuales operativos.",
    placeholder: "Haz una pregunta (ej. '¿Cuál es nuestra política de privacidad de datos?')",
    clearChat: "Borrar Chat",
    chatAssistant: "Asistente de Chat",
    chatSubtitle: "Haz preguntas sobre las políticas de tu empresa y obtén respuestas instantáneas."
  },
  French: {
    greeting: "Bonjour ! Je suis PolicyBot. Posez-moi vos questions concernant les politiques de l'entreprise, les directives de sécurité ou les manuels opérationnels.",
    placeholder: "Posez une question (ex. 'Quelle est notre politique de confidentialité ?')",
    clearChat: "Effacer",
    chatAssistant: "Assistant de Chat",
    chatSubtitle: "Posez des questions sur les politiques de votre entreprise et obtenez des réponses instantanées."
  },
  German: {
    greeting: "Hallo! Ich bin PolicyBot. Stellen Sie mir Fragen zu Ihren Unternehmensrichtlinien, Sicherheitsrichtlinien oder Betriebshandbüchern.",
    placeholder: "Stellen Sie eine Frage (z. B. 'Was ist unsere Datenschutzrichtlinie?')",
    clearChat: "Chat löschen",
    chatAssistant: "Chat-Assistent",
    chatSubtitle: "Stellen Sie Fragen zu den Richtlinien Ihres Unternehmens und erhalten Sie sofortige Antworten."
  },
  Chinese: {
    greeting: "你好！我是 PolicyBot。关于公司政策、安全指南或操作手册，请随时提问。",
    placeholder: "提出问题（例如：'我们的数据隐私政策是什么？'）",
    clearChat: "清除聊天",
    chatAssistant: "聊天助手",
    chatSubtitle: "询问有关公司政策的问题并获得即时解答。"
  },
  Japanese: {
    greeting: "こんにちは！PolicyBotです。企業ポリシー、セキュリティガイドライン、または運用マニュアルについてご質問ください。",
    placeholder: "質問する (例: 「データプライバシーポリシーとは何ですか？」)",
    clearChat: "チャットをクリア",
    chatAssistant: "チャットアシスタント",
    chatSubtitle: "会社のポリシーについて質問し、即座に回答を得ます。"
  },
  Arabic: {
    greeting: "مرحباً! أنا PolicyBot. اسألني أي سؤال بخصوص سياسات شركتك أو إرشادات الأمان أو كتيبات التشغيل.",
    placeholder: "اطرح سؤالاً (مثل 'ما هي سياسة خصوصية البيانات لدينا؟')",
    clearChat: "مسح الدردشة",
    chatAssistant: "مساعد الدردشة",
    chatSubtitle: "اطرح أسئلة حول سياسات شركتك واحصل على إجابات فورية."
  },
  Hindi: {
    greeting: "नमस्ते! मैं PolicyBot हूँ। मुझसे अपनी कॉर्पोरेट नीतियों, सुरक्षा दिशानिर्देशों या परिचालन मैनुअल के बारे में कोई भी प्रश्न पूछें।",
    placeholder: "कोई प्रश्न पूछें (उदा. 'हमारी डेटा गोपनीयता नीति क्या है?')",
    clearChat: "चैट साफ़ करें",
    chatAssistant: "चैट असिस्टेंट",
    chatSubtitle: "अपनी कंपनी की नीतियों के बारे में प्रश्न पूछें और त्वरित उत्तर प्राप्त करें।"
  },
  Tamil: {
    greeting: "வணக்கம்! நான் PolicyBot. உங்கள் நிறுவன கொள்கைகள், பாதுகாப்பு வழிகாட்டுதல்கள் அல்லது செயல்பாட்டு கையேடுகள் குறித்து ஏதேனும் கேள்விகளைக் கேட்கவும்.",
    placeholder: "ஒரு கேள்வியைக் கேளுங்கள் (உதாரணம்: 'எங்கள் தரவு தனியுரிமை கொள்கை என்ன?')",
    clearChat: "அரட்டையை அழி",
    chatAssistant: "அரட்டை உதவியாளர்",
    chatSubtitle: "உங்கள் நிறுவனத்தின் கொள்கைகளைப் பற்றி கேள்விகளைக் கேட்டு உடனடி பதில்களைப் பெறுங்கள்."
  },
  Telugu: {
    greeting: "నమస్కారం! నేను PolicyBot ని. మీ కార్పొరేట్ విధానాలు, భద్రతా మార్గదర్శకాలు లేదా ఆపరేషనల్ మాన్యువల్స్ గురించి నన్ను ఏమైనా అడగండి.",
    placeholder: "ఒక ప్రశ్న అడగండి (ఉదా. 'మా డేటా గోప్యతా విధానం ఏమిటి?')",
    clearChat: "చాట్ క్లియర్ చేయండి",
    chatAssistant: "చాట్ అసిస్టెంట్",
    chatSubtitle: "మీ కంపెనీ విధానాల గురించి ప్రశ్నలు అడగండి మరియు తక్షణ సమాధానాలు పొందండి."
  }
};

export const t = (language, key) => {
  const langPack = translations[language] || translations["English"];
  return langPack[key] || translations["English"][key];
};
