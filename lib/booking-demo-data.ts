import { type LanguageCode } from './languages'

export interface DemoStep {
  instruction: string
  actions: Array<{
    description: string
    method: string
    selector: string
    arguments: Record<string, unknown>
  }>
  pageTitle: string
}

// Pre-recorded booking flows in all 9 languages. Each step represents one
// page state with selectable actions. The booking flow is always the same
// (allow cookies → choose appointment type → pick date/time → confirm),
// so we capture it once and translate into each language.
export const DEMO_BOOKING_FLOWS: Record<LanguageCode, DemoStep[]> = {
  en: [
    {
      instruction: 'The website shows the cookie consent dialog.',
      actions: [
        {
          description: 'Allow all cookies',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: 'Nurse Appointments',
    },
    {
      instruction: 'Now choose the type of appointment.',
      actions: [
        {
          description: 'Schedule a general appointment',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: 'Schedule a follow-up appointment',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: 'Choose Appointment Type',
    },
    {
      instruction: 'Pick a date and time for your appointment.',
      actions: [
        {
          description: 'Book for tomorrow at 10:00 AM',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: 'Book for next week at 2:00 PM',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: 'Choose Date and Time',
    },
    {
      instruction: 'Review and confirm your appointment.',
      actions: [
        {
          description: 'Confirm and complete booking',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: 'Confirm Appointment',
    },
  ],
  pl: [
    {
      instruction: 'Strona pokazuje okno zgody na pliki cookie.',
      actions: [
        {
          description: 'Zezwól na wszystkie pliki cookie',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: 'Wizyty u pielęgniarki',
    },
    {
      instruction: 'Teraz wybierz rodzaj wizyty.',
      actions: [
        {
          description: 'Umów wizytę ogólną',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: 'Umów wizytę kontrolną',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: 'Wybierz typ wizyty',
    },
    {
      instruction: 'Wybierz datę i godzinę wizyty.',
      actions: [
        {
          description: 'Zarezerwuj na jutro o 10:00',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: 'Zarezerwuj na przyszły tydzień o 14:00',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: 'Wybierz datę i godzinę',
    },
    {
      instruction: 'Przejrzyj i potwierdź swoją wizytę.',
      actions: [
        {
          description: 'Potwierdź i zakończ rezerwację',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: 'Potwierdź wizytę',
    },
  ],
  ur: [
    {
      instruction: 'ویب سائٹ کوکی کی رضامندی کے ڈائلاگ کو دکھاتی ہے۔',
      actions: [
        {
          description: 'تمام کوکیز کی اجازت دیں',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: 'نرسنگ اپائنٹمنٹس',
    },
    {
      instruction: 'اب اپائنٹمنٹ کی قسم منتخب کریں۔',
      actions: [
        {
          description: 'عمومی اپائنٹمنٹ بک کریں',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: 'فالو اپ اپائنٹمنٹ بک کریں',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: 'اپائنٹمنٹ کی قسم منتخب کریں',
    },
    {
      instruction: 'اپنی اپائنٹمنٹ کے لیے تاریخ اور وقت منتخب کریں۔',
      actions: [
        {
          description: 'کل 10:00 AM کے لیے بک کریں',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: 'اگلے ہفتہ 2:00 PM کے لیے بک کریں',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: 'تاریخ اور وقت منتخب کریں',
    },
    {
      instruction: 'اپنی اپائنٹمنٹ کو جائزہ لیں اور تصدیق کریں۔',
      actions: [
        {
          description: 'تصدیق کریں اور بکنگ مکمل کریں',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: 'اپائنٹمنٹ کی تصدیق کریں',
    },
  ],
  pa: [
    {
      instruction: 'ਵੈਬਸਾਈਟ ਕੂਕੀ ਸਹਿਮਤੀ ਡਾਇਲਾਗ ਦਿਖਾਉਂਦੀ ਹੈ।',
      actions: [
        {
          description: 'ਸਾਰੀਆਂ ਕੂਕੀਜ਼ ਦੀ ਆਗਿਆ ਦਿਓ',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: 'ਨਰਸ ਨਿਯੁਕਤੀਆਂ',
    },
    {
      instruction: 'ਹੁਣ ਨਿਯੁਕਤੀ ਦੀ ਕਿਸਮ ਚੁਣੋ।',
      actions: [
        {
          description: 'ਆਮ ਨਿਯੁਕਤੀ ਬੁਕ ਕਰੋ',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: 'ਫਾਲੋ-ਅਪ ਨਿਯੁਕਤੀ ਬੁਕ ਕਰੋ',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: 'ਨਿਯੁਕਤੀ ਕਿਸਮ ਚੁਣੋ',
    },
    {
      instruction: 'ਆਪਣੀ ਨਿਯੁਕਤੀ ਲਈ ਤਾਰੀਖ ਅਤੇ ਸਮਾਂ ਚੁਣੋ।',
      actions: [
        {
          description: 'ਕੱਲ 10:00 AM ਲਈ ਬੁਕ ਕਰੋ',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: 'ਅਗਲੇ ਹਫ਼ਤੇ 2:00 PM ਲਈ ਬੁਕ ਕਰੋ',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: 'ਤਾਰੀਖ ਅਤੇ ਸਮਾਂ ਚੁਣੋ',
    },
    {
      instruction: 'ਆਪਣੀ ਨਿਯੁਕਤੀ ਦੀ ਸਮੀਖਿਆ ਅਤੇ ਤਸਦੀਕ ਕਰੋ।',
      actions: [
        {
          description: 'ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਬੁਕਿੰਗ ਮੁਕੰਮਲ ਕਰੋ',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: 'ਨਿਯੁਕਤੀ ਦੀ ਤਸਦੀਕ ਕਰੋ',
    },
  ],
  pa_shahmukhi: [
    {
      instruction: 'ویب سائٹ کوکی کی رضامندی کے ڈائلاگ کو دکھاتی ہے۔',
      actions: [
        {
          description: 'تمام کوکیز کی اجازت دیں',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: 'نرس کی ملاقاتیں',
    },
    {
      instruction: 'اب ملاقات کی قسم منتخب کریں۔',
      actions: [
        {
          description: 'عام ملاقات کا بندوبست کریں',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: 'فالو اپ ملاقات کا بندوبست کریں',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: 'ملاقات کی قسم منتخب کریں',
    },
    {
      instruction: 'اپنی ملاقات کے لیے تاریخ اور وقت منتخب کریں۔',
      actions: [
        {
          description: 'کل 10:00 AM کے لیے بندوبست کریں',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: 'اگلے ہفتے 2:00 PM کے لیے بندوبست کریں',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: 'تاریخ اور وقت منتخب کریں',
    },
    {
      instruction: 'اپنی ملاقات کا جائزہ لیں اور تصدیق کریں۔',
      actions: [
        {
          description: 'تصدیق کریں اور بندوبست مکمل کریں',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: 'ملاقات کی تصدیق کریں',
    },
  ],
  zh: [
    {
      instruction: '网站显示 Cookie 同意对话框。',
      actions: [
        {
          description: '允许所有 Cookie',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: '护士预约',
    },
    {
      instruction: '现在选择预约类型。',
      actions: [
        {
          description: '预约常规就诊',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: '预约复诊',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: '选择预约类型',
    },
    {
      instruction: '为您的预约选择日期和时间。',
      actions: [
        {
          description: '预约明天上午 10:00',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: '预约下周下午 2:00',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: '选择日期和时间',
    },
    {
      instruction: '查看并确认您的预约。',
      actions: [
        {
          description: '确认并完成预约',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: '确认预约',
    },
  ],
  zh_mandharin: [
    {
      instruction: '網站顯示 Cookie 同意對話框。',
      actions: [
        {
          description: '允許所有 Cookie',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: '護士預約',
    },
    {
      instruction: '現在選擇預約類型。',
      actions: [
        {
          description: '預約常規就診',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: '預約複診',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: '選擇預約類型',
    },
    {
      instruction: '為您的預約選擇日期和時間。',
      actions: [
        {
          description: '預約明天上午 10:00',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: '預約下週下午 2:00',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: '選擇日期和時間',
    },
    {
      instruction: '查看並確認您的預約。',
      actions: [
        {
          description: '確認並完成預約',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: '確認預約',
    },
  ],
  ar: [
    {
      instruction: 'يعرض الموقع مربع حوار موافقة ملفات تعريف الارتباط.',
      actions: [
        {
          description: 'السماح بجميع ملفات تعريف الارتباط',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: 'مواعيد الممرضة',
    },
    {
      instruction: 'اختر نوع الموعد الآن.',
      actions: [
        {
          description: 'احجز موعدًا عامًا',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: 'احجز موعد متابعة',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: 'اختر نوع الموعد',
    },
    {
      instruction: 'اختر التاريخ والوقت لموعدك.',
      actions: [
        {
          description: 'احجز غدًا الساعة 10:00 صباحًا',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: 'احجز الأسبوع القادم الساعة 2:00 مساءً',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: 'اختر التاريخ والوقت',
    },
    {
      instruction: 'راجع وأكد موعدك.',
      actions: [
        {
          description: 'أكد وأكمل الحجز',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: 'تأكيد الموعد',
    },
  ],
  bn: [
    {
      instruction: 'ওয়েবসাইটটি কুকি সম্মতি ডায়ালগ প্রদর্শন করে।',
      actions: [
        {
          description: 'সমস্ত কুকি অনুমতি দিন',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: 'নার্স নিয়োগ',
    },
    {
      instruction: 'এখন অ্যাপয়েন্টমেন্টের ধরন নির্বাচন করুন।',
      actions: [
        {
          description: 'সাধারণ অ্যাপয়েন্টমেন্ট বুক করুন',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: 'ফলো-আপ অ্যাপয়েন্টমেন্ট বুক করুন',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: 'অ্যাপয়েন্টমেন্টের ধরন নির্বাচন করুন',
    },
    {
      instruction: 'আপনার অ্যাপয়েন্টমেন্টের জন্য তারিখ এবং সময় নির্বাচন করুন।',
      actions: [
        {
          description: 'আগামীকাল সকাল ১০:০০ এ বুক করুন',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: 'পরের সপ্তাহে দুপুর ২:০০ এ বুক করুন',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: 'তারিখ এবং সময় নির্বাচন করুন',
    },
    {
      instruction: 'আপনার অ্যাপয়েন্টমেন্ট পর্যালোচনা এবং নিশ্চিত করুন।',
      actions: [
        {
          description: 'নিশ্চিত করুন এবং বুকিং সম্পন্ন করুন',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: 'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন',
    },
  ],
  so: [
    {
      instruction: 'Website-ka waxaa lagu tuuraa dialogo-fahamka cookies.',
      actions: [
        {
          description: 'Ogolow dhammaan cookies',
          method: 'click',
          selector: '[aria-label="Accept all cookies"]',
          arguments: {},
        },
      ],
      pageTitle: 'Ag Wakiilka Caafmaadka',
    },
    {
      instruction: 'Hadda doorso nooca walaaca.',
      actions: [
        {
          description: 'Booki walaac guud',
          method: 'click',
          selector: '[role="button"]:has-text("General")',
          arguments: {},
        },
        {
          description: 'Booki walaac dib-u-eegga',
          method: 'click',
          selector: '[role="button"]:has-text("Follow-up")',
          arguments: {},
        },
      ],
      pageTitle: 'Doorso nooca walaaca',
    },
    {
      instruction: 'Doorso maalinada iyo waqtiga walaacaaga.',
      actions: [
        {
          description: 'Booki berri 10:00 AM',
          method: 'click',
          selector: '[data-time="tomorrow-10:00"]',
          arguments: {},
        },
        {
          description: 'Booki habka dambe 2:00 PM',
          method: 'click',
          selector: '[data-time="next-week-14:00"]',
          arguments: {},
        },
      ],
      pageTitle: 'Doorso maalinada iyo waqtiga',
    },
    {
      instruction: 'Dib u eeg oo xaqiji walaacaaga.',
      actions: [
        {
          description: 'Xaqiji oo dhamaystir bookiga',
          method: 'click',
          selector: '[role="button"]:has-text("Confirm")',
          arguments: {},
        },
      ],
      pageTitle: 'Xaqiji walaaca',
    },
  ],
}
