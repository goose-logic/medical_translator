import { type LanguageCode } from './languages'

export interface DemoAction {
  description: string
  method: string
  selector: string
  arguments: Record<string, unknown>
}

export interface DemoStep {
  instruction: string
  actions: DemoAction[]
  pageTitle: string
}

export interface DemoFlow {
  // Spoken intro when the session starts.
  intro: string
  // Spoken message once every step is complete.
  complete: string
  steps: DemoStep[]
}

// Pre-recorded booking flows in all 9 languages. The real GP website
// (Hero Health) always follows the same path, so we capture it once and
// hand-translate into each language. Because every string here is already
// localized, demo mode needs NO gateway calls at all — it is instant and
// never rate-limited.
//
// Flow (6 steps):
//   1. Accept cookies
//   2. Choose appointment type (GP vs nurse)
//   3. Choose how to be seen (in person vs GP telephone)
//   4. Choose date & time
//   5. Enter your details (use saved profile details)
//   6. Review & confirm
function click(description: string): DemoAction {
  return { description, method: 'click', selector: '', arguments: {} }
}

export const DEMO_BOOKING_FLOWS: Record<LanguageCode, DemoFlow> = {
  en: {
    intro:
      'I have opened the appointment booking website. I will guide you through it step by step.',
    complete:
      'Your appointment is booked. You will receive a confirmation text message shortly.',
    steps: [
      {
        instruction: 'The website is asking about cookies. Let us accept them so we can continue.',
        actions: [click('Allow all cookies')],
        pageTitle: 'Welcome',
      },
      {
        instruction: 'Choose the type of appointment you need.',
        actions: [click('Book a GP appointment'), click('Book a nurse appointment')],
        pageTitle: 'Choose appointment type',
      },
      {
        instruction: 'How would you like to see the GP?',
        actions: [click('In-person appointment'), click('GP telephone appointment')],
        pageTitle: 'Choose how to be seen',
      },
      {
        instruction: 'Choose a date and time that suits you.',
        actions: [click('Tomorrow at 10:00 AM'), click('Next week at 2:00 PM')],
        pageTitle: 'Choose date and time',
      },
      {
        instruction:
          'Now we enter your details to hold the appointment. I can use the details from your profile.',
        actions: [click('Use my saved details')],
        pageTitle: 'Your details',
      },
      {
        instruction: 'Please review everything and confirm your booking.',
        actions: [click('Confirm and book appointment')],
        pageTitle: 'Confirm booking',
      },
    ],
  },
  pl: {
    intro:
      'Otworzyłem stronę rezerwacji wizyt. Przeprowadzę Cię przez nią krok po kroku.',
    complete:
      'Twoja wizyta została zarezerwowana. Wkrótce otrzymasz potwierdzenie SMS-em.',
    steps: [
      {
        instruction: 'Strona pyta o pliki cookie. Zaakceptujmy je, aby kontynuować.',
        actions: [click('Zezwól na wszystkie pliki cookie')],
        pageTitle: 'Witamy',
      },
      {
        instruction: 'Wybierz rodzaj potrzebnej wizyty.',
        actions: [click('Umów wizytę u lekarza rodzinnego'), click('Umów wizytę u pielęgniarki')],
        pageTitle: 'Wybierz rodzaj wizyty',
      },
      {
        instruction: 'Jak chcesz odbyć wizytę u lekarza?',
        actions: [click('Wizyta osobista'), click('Wizyta telefoniczna u lekarza')],
        pageTitle: 'Wybierz formę wizyty',
      },
      {
        instruction: 'Wybierz dogodną datę i godzinę.',
        actions: [click('Jutro o 10:00'), click('W przyszłym tygodniu o 14:00')],
        pageTitle: 'Wybierz datę i godzinę',
      },
      {
        instruction:
          'Teraz podamy Twoje dane, aby zarezerwować wizytę. Mogę użyć danych z Twojego profilu.',
        actions: [click('Użyj moich zapisanych danych')],
        pageTitle: 'Twoje dane',
      },
      {
        instruction: 'Sprawdź wszystko i potwierdź rezerwację.',
        actions: [click('Potwierdź i zarezerwuj wizytę')],
        pageTitle: 'Potwierdź rezerwację',
      },
    ],
  },
  ur: {
    intro:
      'میں نے اپائنٹمنٹ بکنگ کی ویب سائٹ کھول دی ہے۔ میں آپ کو قدم بہ قدم رہنمائی کروں گا۔',
    complete:
      'آپ کی اپائنٹمنٹ بک ہو گئی ہے۔ آپ کو جلد ہی ایک تصدیقی ٹیکسٹ پیغام موصول ہوگا۔',
    steps: [
      {
        instruction: 'ویب سائٹ کوکیز کے بارے میں پوچھ رہی ہے۔ جاری رکھنے کے لیے انہیں قبول کریں۔',
        actions: [click('تمام کوکیز کی اجازت دیں')],
        pageTitle: 'خوش آمدید',
      },
      {
        instruction: 'اپنی مطلوبہ اپائنٹمنٹ کی قسم منتخب کریں۔',
        actions: [click('جی پی اپائنٹمنٹ بک کریں'), click('نرس اپائنٹمنٹ بک کریں')],
        pageTitle: 'اپائنٹمنٹ کی قسم منتخب کریں',
      },
      {
        instruction: 'آپ جی پی سے کیسے ملنا چاہتے ہیں؟',
        actions: [click('بالمشافہ اپائنٹمنٹ'), click('جی پی ٹیلیفون اپائنٹمنٹ')],
        pageTitle: 'ملاقات کا طریقہ منتخب کریں',
      },
      {
        instruction: 'اپنی سہولت کے مطابق تاریخ اور وقت منتخب کریں۔',
        actions: [click('کل صبح 10:00 بجے'), click('اگلے ہفتے دوپہر 2:00 بجے')],
        pageTitle: 'تاریخ اور وقت منتخب کریں',
      },
      {
        instruction:
          'اب اپائنٹمنٹ محفوظ کرنے کے لیے آپ کی تفصیلات درج کرتے ہیں۔ میں آپ کے پروفائل کی تفصیلات استعمال کر سکتا ہوں۔',
        actions: [click('میری محفوظ کردہ تفصیلات استعمال کریں')],
        pageTitle: 'آپ کی تفصیلات',
      },
      {
        instruction: 'براہ کرم سب کچھ جائزہ لیں اور اپنی بکنگ کی تصدیق کریں۔',
        actions: [click('تصدیق کریں اور اپائنٹمنٹ بک کریں')],
        pageTitle: 'بکنگ کی تصدیق کریں',
      },
    ],
  },
  pa: {
    intro:
      'ਮੈਂ ਮੁਲਾਕਾਤ ਬੁਕਿੰਗ ਵੈੱਬਸਾਈਟ ਖੋਲ੍ਹ ਦਿੱਤੀ ਹੈ। ਮੈਂ ਤੁਹਾਨੂੰ ਕਦਮ-ਦਰ-ਕਦਮ ਰਾਹ ਦਿਖਾਵਾਂਗਾ।',
    complete:
      'ਤੁਹਾਡੀ ਮੁਲਾਕਾਤ ਬੁਕ ਹੋ ਗਈ ਹੈ। ਤੁਹਾਨੂੰ ਜਲਦੀ ਹੀ ਇੱਕ ਪੁਸ਼ਟੀ ਟੈਕਸਟ ਸੁਨੇਹਾ ਮਿਲੇਗਾ।',
    steps: [
      {
        instruction: 'ਵੈੱਬਸਾਈਟ ਕੂਕੀਜ਼ ਬਾਰੇ ਪੁੱਛ ਰਹੀ ਹੈ। ਜਾਰੀ ਰੱਖਣ ਲਈ ਇਨ੍ਹਾਂ ਨੂੰ ਸਵੀਕਾਰ ਕਰੋ।',
        actions: [click('ਸਾਰੀਆਂ ਕੂਕੀਜ਼ ਦੀ ਆਗਿਆ ਦਿਓ')],
        pageTitle: 'ਜੀ ਆਇਆਂ ਨੂੰ',
      },
      {
        instruction: 'ਆਪਣੀ ਲੋੜੀਂਦੀ ਮੁਲਾਕਾਤ ਦੀ ਕਿਸਮ ਚੁਣੋ।',
        actions: [click('ਜੀਪੀ ਮੁਲਾਕਾਤ ਬੁਕ ਕਰੋ'), click('ਨਰਸ ਮੁਲਾਕਾਤ ਬੁਕ ਕਰੋ')],
        pageTitle: 'ਮੁਲਾਕਾਤ ਦੀ ਕਿਸਮ ਚੁਣੋ',
      },
      {
        instruction: 'ਤੁਸੀਂ ਜੀਪੀ ਨੂੰ ਕਿਵੇਂ ਮਿਲਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
        actions: [click('ਰੂਬਰੂ ਮੁਲਾਕਾਤ'), click('ਜੀਪੀ ਟੈਲੀਫੋਨ ਮੁਲਾਕਾਤ')],
        pageTitle: 'ਮੁਲਾਕਾਤ ਦਾ ਤਰੀਕਾ ਚੁਣੋ',
      },
      {
        instruction: 'ਆਪਣੀ ਸਹੂਲਤ ਅਨੁਸਾਰ ਤਾਰੀਖ ਅਤੇ ਸਮਾਂ ਚੁਣੋ।',
        actions: [click('ਕੱਲ੍ਹ ਸਵੇਰੇ 10:00 ਵਜੇ'), click('ਅਗਲੇ ਹਫ਼ਤੇ ਦੁਪਹਿਰ 2:00 ਵਜੇ')],
        pageTitle: 'ਤਾਰੀਖ ਅਤੇ ਸਮਾਂ ਚੁਣੋ',
      },
      {
        instruction:
          'ਹੁਣ ਮੁਲਾਕਾਤ ਰਾਖਵੀਂ ਕਰਨ ਲਈ ਤੁਹਾਡੇ ਵੇਰਵੇ ਦਰਜ ਕਰਦੇ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੇ ਪ੍ਰੋਫਾਈਲ ਦੇ ਵੇਰਵੇ ਵਰਤ ਸਕਦਾ ਹਾਂ।',
        actions: [click('ਮੇਰੇ ਸੰਭਾਲੇ ਵੇਰਵੇ ਵਰਤੋ')],
        pageTitle: 'ਤੁਹਾਡੇ ਵੇਰਵੇ',
      },
      {
        instruction: 'ਕਿਰਪਾ ਕਰਕੇ ਸਭ ਕੁਝ ਵੇਖੋ ਅਤੇ ਆਪਣੀ ਬੁਕਿੰਗ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।',
        actions: [click('ਪੁਸ਼ਟੀ ਕਰੋ ਅਤੇ ਮੁਲਾਕਾਤ ਬੁਕ ਕਰੋ')],
        pageTitle: 'ਬੁਕਿੰਗ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
      },
    ],
  },
  pa_shahmukhi: {
    intro:
      'میں نے اپائنٹمنٹ بکنگ دی ویب سائٹ کھول دتی اے۔ میں تہانوں قدم بہ قدم رہنمائی کراں گا۔',
    complete:
      'تہاڈی اپائنٹمنٹ بک ہو گئی اے۔ تہانوں چھیتی ہی اک تصدیقی ٹیکسٹ پیغام ملے گا۔',
    steps: [
      {
        instruction: 'ویب سائٹ کوکیز بارے پُچھ رہی اے۔ جاری رکھن لئی انہاں نوں قبول کرو۔',
        actions: [click('ساریاں کوکیز دی اجازت دیو')],
        pageTitle: 'جی آیاں نوں',
      },
      {
        instruction: 'اپنی لوڑیندی اپائنٹمنٹ دی قسم چُنو۔',
        actions: [click('جی پی اپائنٹمنٹ بک کرو'), click('نرس اپائنٹمنٹ بک کرو')],
        pageTitle: 'اپائنٹمنٹ دی قسم چُنو',
      },
      {
        instruction: 'تسیں جی پی نوں کِویں ملنا چاہندے او؟',
        actions: [click('روبرو اپائنٹمنٹ'), click('جی پی ٹیلیفون اپائنٹمنٹ')],
        pageTitle: 'ملاقات دا طریقہ چُنو',
      },
      {
        instruction: 'اپنی سہولت مطابق تاریخ تے ویلا چُنو۔',
        actions: [click('کل صبح 10:00 وجے'), click('اگلے ہفتے دوپہر 2:00 وجے')],
        pageTitle: 'تاریخ تے ویلا چُنو',
      },
      {
        instruction:
          'ہُن اپائنٹمنٹ رکھن لئی تہاڈے ویروے درج کردے آں۔ میں تہاڈے پروفائل دے ویروے ورت سکدا آں۔',
        actions: [click('میرے سنبھالے ویروے ورتو')],
        pageTitle: 'تہاڈے ویروے',
      },
      {
        instruction: 'مہربانی کر کے سب کجھ ویکھو تے اپنی بکنگ دی تصدیق کرو۔',
        actions: [click('تصدیق کرو تے اپائنٹمنٹ بک کرو')],
        pageTitle: 'بکنگ دی تصدیق کرو',
      },
    ],
  },
  zh: {
    intro: '我已经打开了预约挂号网站。我会一步一步引导您完成。',
    complete: '您的预约已成功。您很快会收到确认短信。',
    steps: [
      {
        instruction: '网站询问关于 Cookie 的设置。让我们接受以便继续。',
        actions: [click('允许所有 Cookie')],
        pageTitle: '欢迎',
      },
      {
        instruction: '请选择您需要的预约类型。',
        actions: [click('预约全科医生（GP）'), click('预约护士')],
        pageTitle: '选择预约类型',
      },
      {
        instruction: '您希望以哪种方式就诊？',
        actions: [click('面对面就诊'), click('全科医生电话问诊')],
        pageTitle: '选择就诊方式',
      },
      {
        instruction: '请选择适合您的日期和时间。',
        actions: [click('明天上午 10:00'), click('下周下午 2:00')],
        pageTitle: '选择日期和时间',
      },
      {
        instruction: '现在填写您的信息以保留预约。我可以使用您个人资料中的信息。',
        actions: [click('使用我保存的信息')],
        pageTitle: '您的信息',
      },
      {
        instruction: '请核对所有信息并确认您的预约。',
        actions: [click('确认并预约')],
        pageTitle: '确认预约',
      },
    ],
  },
  zh_mandharin: {
    intro: '我已經打開了預約掛號網站。我會一步一步引導您完成。',
    complete: '您的預約已成功。您很快會收到確認簡訊。',
    steps: [
      {
        instruction: '網站詢問關於 Cookie 的設定。讓我們接受以便繼續。',
        actions: [click('允許所有 Cookie')],
        pageTitle: '歡迎',
      },
      {
        instruction: '請選擇您需要的預約類型。',
        actions: [click('預約全科醫生（GP）'), click('預約護士')],
        pageTitle: '選擇預約類型',
      },
      {
        instruction: '您希望以哪種方式就診？',
        actions: [click('面對面就診'), click('全科醫生電話問診')],
        pageTitle: '選擇就診方式',
      },
      {
        instruction: '請選擇適合您的日期和時間。',
        actions: [click('明天上午 10:00'), click('下週下午 2:00')],
        pageTitle: '選擇日期和時間',
      },
      {
        instruction: '現在填寫您的資訊以保留預約。我可以使用您個人資料中的資訊。',
        actions: [click('使用我儲存的資訊')],
        pageTitle: '您的資訊',
      },
      {
        instruction: '請核對所有資訊並確認您的預約。',
        actions: [click('確認並預約')],
        pageTitle: '確認預約',
      },
    ],
  },
  ar: {
    intro: 'لقد فتحت موقع حجز المواعيد. سأرشدك خطوة بخطوة.',
    complete: 'تم حجز موعدك. ستتلقى رسالة نصية للتأكيد قريبًا.',
    steps: [
      {
        instruction: 'يسأل الموقع عن ملفات تعريف الارتباط. دعنا نقبلها للمتابعة.',
        actions: [click('السماح بجميع ملفات تعريف الارتباط')],
        pageTitle: 'مرحبًا',
      },
      {
        instruction: 'اختر نوع الموعد الذي تحتاجه.',
        actions: [click('حجز موعد مع طبيب عام'), click('حجز موعد مع ممرضة')],
        pageTitle: 'اختر نوع الموعد',
      },
      {
        instruction: 'كيف تريد رؤية الطبيب العام؟',
        actions: [click('موعد حضوري'), click('موعد هاتفي مع الطبيب العام')],
        pageTitle: 'اختر طريقة الموعد',
      },
      {
        instruction: 'اختر التاريخ والوقت المناسبين لك.',
        actions: [click('غدًا الساعة 10:00 صباحًا'), click('الأسبوع القادم الساعة 2:00 مساءً')],
        pageTitle: 'اختر التاريخ والوقت',
      },
      {
        instruction: 'الآن ندخل بياناتك لحجز الموعد. يمكنني استخدام البيانات من ملفك الشخصي.',
        actions: [click('استخدم بياناتي المحفوظة')],
        pageTitle: 'بياناتك',
      },
      {
        instruction: 'يرجى مراجعة كل شيء وتأكيد الحجز.',
        actions: [click('تأكيد وحجز الموعد')],
        pageTitle: 'تأكيد الحجز',
      },
    ],
  },
  bn: {
    intro:
      'আমি অ্যাপয়েন্টমেন্ট বুকিং ওয়েবসাইটটি খুলেছি। আমি আপনাকে ধাপে ধাপে সাহায্য করব।',
    complete:
      'আপনার অ্যাপয়েন্টমেন্ট বুক হয়ে গেছে। আপনি শীঘ্রই একটি নিশ্চিতকরণ টেক্সট বার্তা পাবেন।',
    steps: [
      {
        instruction: 'ওয়েবসাইটটি কুকি সম্পর্কে জিজ্ঞাসা করছে। চালিয়ে যেতে এগুলি গ্রহণ করুন।',
        actions: [click('সমস্ত কুকি অনুমতি দিন')],
        pageTitle: 'স্বাগতম',
      },
      {
        instruction: 'আপনার প্রয়োজনীয় অ্যাপয়েন্টমেন্টের ধরন নির্বাচন করুন।',
        actions: [click('জিপি অ্যাপয়েন্টমেন্ট বুক করুন'), click('নার্স অ্যাপয়েন্টমেন্ট বুক করুন')],
        pageTitle: 'অ্যাপয়েন্টমেন্টের ধরন নির্বাচন করুন',
      },
      {
        instruction: 'আপনি কীভাবে জিপি-র সাথে দেখা করতে চান?',
        actions: [click('সশরীরে অ্যাপয়েন্টমেন্ট'), click('জিপি টেলিফোন অ্যাপয়েন্টমেন্ট')],
        pageTitle: 'দেখা করার উপায় নির্বাচন করুন',
      },
      {
        instruction: 'আপনার সুবিধামতো একটি তারিখ ও সময় নির্বাচন করুন।',
        actions: [click('আগামীকাল সকাল ১০:০০ টায়'), click('পরের সপ্তাহে দুপুর ২:০০ টায়')],
        pageTitle: 'তারিখ ও সময় নির্বাচন করুন',
      },
      {
        instruction:
          'এখন অ্যাপয়েন্টমেন্ট সংরক্ষণ করতে আপনার তথ্য দিন। আমি আপনার প্রোফাইলের তথ্য ব্যবহার করতে পারি।',
        actions: [click('আমার সংরক্ষিত তথ্য ব্যবহার করুন')],
        pageTitle: 'আপনার তথ্য',
      },
      {
        instruction: 'অনুগ্রহ করে সবকিছু পর্যালোচনা করুন এবং আপনার বুকিং নিশ্চিত করুন।',
        actions: [click('নিশ্চিত করুন এবং অ্যাপয়েন্টমেন্ট বুক করুন')],
        pageTitle: 'বুকিং নিশ্চিত করুন',
      },
    ],
  },
  so: {
    intro:
      'Waxaan furay website-ka ballan-qaadka. Waxaan ku hagi doonaa tallaabo-tallaabo.',
    complete:
      'Ballantaada waa la qabtay. Waxaad dhawaan heli doontaa fariin xaqiijin ah.',
    steps: [
      {
        instruction: 'Website-ku wuxuu ku weydiinayaa cookies. Aan aqbalno si aan u sii wadno.',
        actions: [click('Ogolow dhammaan cookies')],
        pageTitle: 'Soo dhawoow',
      },
      {
        instruction: 'Dooro nooca ballanta aad u baahan tahay.',
        actions: [click('Qabso ballan dhakhtar guud (GP)'), click('Qabso ballan kalkaaliye')],
        pageTitle: 'Dooro nooca ballanta',
      },
      {
        instruction: 'Sidee ayaad rabtaa inaad la kulanto dhakhtarka?',
        actions: [click('Ballan wajaha-wajaha ah'), click('Ballan telefoon ee dhakhtarka')],
        pageTitle: 'Dooro sida loo arko',
      },
      {
        instruction: 'Dooro taariikh iyo waqti kugu habboon.',
        actions: [click('Berri 10:00 subaxnimo'), click('Toddobaadka soo socda 2:00 galabnimo')],
        pageTitle: 'Dooro taariikh iyo waqti',
      },
      {
        instruction:
          'Hadda waxaan gelinaynaa faahfaahintaada si aan u qabsanno ballanta. Waxaan isticmaali karaa faahfaahinta profile-kaaga.',
        actions: [click('Isticmaal faahfaahintayda la keydiyay')],
        pageTitle: 'Faahfaahintaada',
      },
      {
        instruction: 'Fadlan dib u eeg wax walba oo xaqiiji ballantaada.',
        actions: [click('Xaqiiji oo qabso ballanta')],
        pageTitle: 'Xaqiiji ballanta',
      },
    ],
  },
}
