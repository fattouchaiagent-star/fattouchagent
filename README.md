# FATTOUCH AI

منصة ذكاء اصطناعي مخصصة للبنان، تفهم اللغة والسياق المحليين، تبحث في مصادر موثوقة، وتنفّذ المهام بموافقة المستخدم.

## حالة المشروع

يوجد Prototype تطبيقي محلي مبني على React/Vite وNode/SQLite. الحالة الحالية
MVP للتجربة الداخلية وليست جاهزة للنشر العام أو استقبال مدفوعات حقيقية.

## التشغيل المحلي

```bash
npm install
npm run dev -- --host 127.0.0.1
APP_ORIGINS=http://127.0.0.1:5173 API_PORT=8787 DATA_DIR=data npm run server
```

التحقق الحالي:

```bash
node --check server/index.js
npm run build
```

يجب قبل النشر العام إكمال عزل الحسابات، اختبارات الأمان، دورة دفع Whish،
التخزين الإنتاجي، ومصادر الذكاء الاصطناعي الحقيقية.

## الوثائق

- [PRD الكامل](docs/PRD.md)
- [رؤية المنتج ونطاقه](docs/PRODUCT-VISION.md)
- [تدفقات المستخدم](docs/USER-FLOWS.md)
- [مواصفات تجربة المستخدم](docs/UX-SPEC.md)
- [المتطلبات التقنية](docs/TECHNICAL-REQUIREMENTS.md)
- [مصادر البيانات والبحث](docs/DATA-SOURCES.md)
- [الأمان والخصوصية](docs/SECURITY-PRIVACY.md)
- [خطة الإطلاق والتحليلات](docs/ROADMAP-ANALYTICS.md)
- [Prototype المحادثة الأساسية](docs/CONVERSATION-PROTOTYPE.md)
- [خطة العمل الاحترافية](docs/IMPLEMENTATION-PLAN.md)
- [نظام التصميم](docs/DESIGN-SYSTEM.md)
- [عقد طبقة الوكيل](docs/API-CONTRACT.md)

## المبدأ الأساسي

> لا نعرض تفكير النموذج الداخلي؛ نعرض خطوات العمل، الأدوات المستخدمة، المصادر، النتائج، وحالات عدم اليقين بشكل قابل للتحقق.
