# FATTOUCH AI — عقد طبقة الوكيل الأولية

## الهدف

فصل واجهة المحادثة عن الذكاء الاصطناعي ومصادر لبنان. الواجهة الحالية تستخدم `classifyTask` ومسارات تجريبية فقط؛ لا تعتبر النتائج الحالية بيانات حقيقية.

## دورة الطلب

```text
POST /api/tasks
→ task.created
→ task.planning
→ tool.started
→ tool.result
→ task.verifying
→ task.completed أو task.failed
```

## إنشاء مهمة

`POST /api/tasks`

```json
{
  "conversationId": "conversation-id",
  "message": "ابحث عن وظيفة Frontend في بيروت",
  "attachments": [],
  "locale": "ar-LB"
}
```

## أحداث البث

كل حدث يجب أن يحتوي على:

```json
{
  "id": "event-id",
  "taskId": "task-id",
  "type": "tool.started",
  "label": "البحث في وظائف داخل لبنان",
  "status": "running",
  "createdAt": "2026-09-23T00:00:00Z"
}
```

الأنواع المسموحة في النسخة الأولى:

- `task.created`
- `task.planning`
- `tool.started`
- `tool.result`
- `task.verifying`
- `approval.required`
- `task.completed`
- `task.failed`

## الموافقة

لا يجوز للخادم تنفيذ إرسال أو حجز أو مشاركة ملف قبل موافقة صريحة:

`POST /api/tasks/:taskId/approval`

```json
{
  "decision": "approved"
}
```

القيم المسموحة: `approved`, `rejected`.

## قواعد أمان

- لا تُرسل مفاتيح API إلى المتصفح.
- لا تعتبر نتيجة الأداة حقيقة قبل التحقق من المصدر والتاريخ.
- سجّل كل موافقة مع وقتها ونطاقها.
- اجعل الموافقة مرتبطة بمهمة محددة، ولا تعممها على الطلبات المستقبلية.
- لا تعرض سلسلة التفكير الداخلية؛ اعرض خطة العمل والأدوات والنتائج القابلة للتحقق فقط.
