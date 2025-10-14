import type { Metadata } from "next";

type Section = {
  title: string;
  content: string[];
};

const englishSections: Section[] = [
  {
    title: "Introduction",
    content: [
      "Welcome to Marhabten, the platform that connects hosts and guests for short-term rental properties. By accessing or using our app, you agree to abide by the following terms and services.",
      "Marhabten is operated by Digital Stream for Information Company. For privacy or data protection inquiries, please contact us at Digital.Stream.Support@Marhabten.net or call 00218916219393 / 00218926219393.",
    ],
  },
  {
    title: "Definitions",
    content: [
      `"Hosts" refer to individuals who list their properties for short-term rental.`,
      `"Guests" refer to individuals who book and stay at properties listed on the app.`,
    ],
  },
  {
    title: "Property Listings",
    content: [
      "Hosts are responsible for creating accurate and complete property listings, including images, descriptions, and location information. The app reserves the right to review and remove listings that violate our policies.",
    ],
  },
  {
    title: "Payments",
    content: [
      "The app supports all local payment methods for booking properties. Guests are required to pay a non-refundable deposit to secure their reservation.",
    ],
  },
  {
    title: "User Verification",
    content: [
      "To enhance user safety and security, we offer users the option to verify their identity by uploading government-issued IDs. Rest assured, your personal information remains confidential and is not shared with anyone.",
    ],
  },
  {
    title: "Safety and Security",
    content: [
      "Safety and security are the responsibility of both hosts and guests. The app provides contact information for local emergency services but does not take responsibility for any incidents that may occur during a stay.",
    ],
  },
  {
    title: "Dispute Resolution",
    content: [
      "Any disputes between users, including hosts and guests, should be handled directly between the parties involved. While we are not responsible for resolving disputes, we encourage users to inform us of any issues through our email for feedback and improvement.",
    ],
  },
  {
    title: "Customer Support",
    content: [
      "Customer support is available through email at Digital.Stream.Support@Marhabten.net and by phone at 00218916219393 / 00218926219393. We strive to respond promptly to any inquiries or issues you may have.",
    ],
  },
  {
    title: "Registration and Account Switching",
    content: [
      "Registration is free for all users. Users can switch between guest and host accounts. Hosts are responsible for managing their property details and availability under their own responsibility.",
    ],
  },
  {
    title: "Fee Structure",
    content: [
      "Hosts will be charged a service fee of 10% on the total booking amount for each successful reservation made through the app.",
      "Guests will be charged an additional service fee of 2% on the total booking amount for each successful reservation made through the app.",
      "The total fee for a booking will amount to 102% of the booking value.",
    ],
  },
  {
    title: "Payment Process",
    content: [
      "Upon booking confirmation, guests are required to pay a deposit of 12% of the total booking amount through the app. The remaining balance of 90% shall be paid in cash by the guest directly to the host during the check-in process.",
    ],
  },
  {
    title: "Cancellation Policy",
    content: [
      "In the event of a cancellation by the guest, the deposit paid through the app (12%) is non-refundable. Hosts are responsible for setting their own cancellation policies for the remaining 90% cash payment. Guests must adhere to the host's cancellation policy.",
    ],
  },
  {
    title: "Modifications to Terms",
    content: [
      "Any future modifications to the terms and services will be notified to users and will be applicable from the date specified in the notification.",
    ],
  },
  {
    title: "Governing Law and Jurisdiction",
    content: [
      "These terms and services are governed by the laws of Libya. Any disputes shall be subject to the exclusive jurisdiction of the courts in Libya.",
    ],
  },
];

const arabicSections: Section[] = [
  {
    title: "المقدمة",
    content: [
      "مرحبًا بكم في مرحبتين، المنصة التي تربط بين المضيفين والضيوف لتأجير العقارات قصيرة الأجل. من خلال الوصول إلى تطبيقنا أو استخدامه، فإنك توافق على الالتزام بالشروط والخدمات التالية.",
      "تُدار مرحبتين بواسطة Digital Stream for Information Company. للاستفسارات المتعلقة بالخصوصية أو حماية البيانات، يرجى التواصل عبر البريد الإلكتروني Digital.Stream.Support@Marhabten.net أو الاتصال على 00218916219393 / 00218926219393.",
    ],
  },
  {
    title: "التعريفات",
    content: [
      "يشير مصطلح \"المضيفين\" إلى الأفراد الذين يعرضون عقاراتهم للتأجير قصير الأجل.",
      "يشير مصطلح \"الضيوف\" إلى الأفراد الذين يحجزون العقارات المدرجة في التطبيق ويقيمون فيها.",
    ],
  },
  {
    title: "قوائم العقارات",
    content: [
      "يتحمل المضيفون مسؤولية إنشاء قوائم عقارية دقيقة ومتكاملة، بما في ذلك الصور والوصف ومعلومات الموقع. يحتفظ التطبيق بالحق في مراجعة القوائم التي تنتهك سياساتنا وإزالتها.",
    ],
  },
  {
    title: "المدفوعات",
    content: [
      "يدعم التطبيق جميع طرق الدفع المحلية لحجز العقارات. يُلزم الضيوف بدفع عربون غير قابل للاسترداد لتأكيد الحجز.",
    ],
  },
  {
    title: "التحقق من المستخدم",
    content: [
      "لتحسين أمان المستخدم، نوفر خيار التحقق من الهوية من خلال رفع مستندات رسمية صادرة عن جهة حكومية. نؤكد بقاء معلوماتك الشخصية سرية ولن تتم مشاركتها مع أي طرف.",
    ],
  },
  {
    title: "السلامة والأمان",
    content: [
      "السلامة والأمان مسؤولية مشتركة بين المضيفين والضيوف. يوفر التطبيق معلومات الاتصال بخدمات الطوارئ المحلية، لكنه لا يتحمل مسؤولية أي حوادث قد تقع أثناء الإقامة.",
    ],
  },
  {
    title: "حل النزاعات",
    content: [
      "يجب معالجة أي نزاعات بين المستخدمين، بما في ذلك المضيفين والضيوف، مباشرة بين الأطراف المعنية. وعلى الرغم من أننا لسنا مسؤولين عن حل النزاعات، فإننا نشجع المستخدمين على إبلاغنا بأي مشكلات عبر بريدنا الإلكتروني لتحسين الخدمات.",
    ],
  },
  {
    title: "دعم العملاء",
    content: [
      "يتوفر دعم العملاء عبر البريد الإلكتروني Digital.Stream.Support@Marhabten.net وعبر الأرقام 00218916219393 / 00218926219393. نسعى إلى الرد بسرعة على أي استفسارات أو مشكلات قد تواجهك.",
    ],
  },
  {
    title: "التسجيل وتبديل الحساب",
    content: [
      "التسجيل مجاني لجميع المستخدمين. يمكن للمستخدمين التنقل بين حسابي الضيف والمضيف. ويتحمل المضيفون مسؤولية إدارة تفاصيل عقاراتهم وتوافرها بالكامل.",
    ],
  },
  {
    title: "هيكل الرسوم",
    content: [
      "يتم فرض رسم خدمة على المضيفين قدره 10% من إجمالي مبلغ الحجز لكل حجز ناجح يتم عبر التطبيق.",
      "يتم فرض رسم خدمة إضافي على الضيوف قدره 2% من إجمالي مبلغ الحجز لكل حجز ناجح يتم عبر التطبيق.",
      "يصل إجمالي الرسوم المفروضة على الحجز إلى 102% من قيمة الحجز.",
    ],
  },
  {
    title: "عملية الدفع",
    content: [
      "عند تأكيد الحجز، يجب على الضيوف دفع عربون بنسبة 12% من إجمالي مبلغ الحجز عبر التطبيق. يتم دفع الرصيد المتبقي البالغ 90% نقدًا من قبل الضيف مباشرة إلى المضيف عند تسجيل الوصول.",
    ],
  },
  {
    title: "سياسة الإلغاء",
    content: [
      "في حال إلغاء الضيف للحجز، فإن العربون المدفوع عبر التطبيق (12%) غير قابل للاسترداد. يتحمل المضيفون مسؤولية تحديد سياسات الإلغاء الخاصة بهم بالنسبة للدفعة النقدية المتبقية البالغة 90%. يجب على الضيوف الالتزام بسياسة الإلغاء الخاصة بالمضيف.",
    ],
  },
  {
    title: "تعديل الشروط",
    content: [
      "سيتم إشعار المستخدمين بأي تعديلات مستقبلية على الشروط والخدمات، وتصبح التعديلات سارية من التاريخ المحدد في الإشعار.",
    ],
  },
  {
    title: "القانون الواجب التطبيق والاختصاص القضائي",
    content: [
      "تخضع هذه الشروط والخدمات لقوانين ليبيا. وتخضع أي نزاعات للاختصاص القضائي الحصري لمحاكم ليبيا.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy | Marhabten Dashboard",
  description:
    "Privacy policy for Marhabten operated by Digital Stream for Information Company, available in English and Arabic.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-12 rounded-2xl bg-white p-8 shadow-sm">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Marhabten Privacy Policy</h1>
          <p className="text-gray-600">
            Legal entity: Digital Stream for Information Company
          </p>
          <p className="text-gray-600">
            Contact: Digital.Stream.Support@Marhabten.net | 00218916219393 / 00218926219393
          </p>
        </header>

        <section aria-labelledby="privacy-policy-en" lang="en" className="space-y-6">
          <div className="space-y-2">
            <h2 id="privacy-policy-en" className="text-2xl font-semibold text-gray-900">
              Privacy Policy (English)
            </h2>
            <p className="text-sm text-gray-600">
              The following terms outline how Marhabten, operated by Digital Stream for Information
              Company, maintains platform integrity, protects users, and governs bookings.
            </p>
          </div>
          <ol className="list-decimal space-y-4 pl-5 text-gray-800">
            {englishSections.map((section) => (
              <li key={section.title} className="space-y-2">
                <span className="font-semibold text-gray-900">{section.title}</span>
                {section.content.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-relaxed text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="privacy-policy-ar"
          lang="ar"
          dir="rtl"
          className="space-y-6 text-right"
        >
          <div className="space-y-2">
            <h2 id="privacy-policy-ar" className="text-2xl font-semibold text-gray-900">
              سياسة الخصوصية (العربية)
            </h2>
            <p className="text-sm text-gray-600">
              توضح الشروط التالية الكيفية التي تحافظ بها مرحبتين، بإدارة Digital Stream for
              Information Company، على سلامة المنصة وتحمي المستخدمين وتنظم الحجوزات.
            </p>
          </div>
          <ol className="list-decimal space-y-4 pr-5 text-gray-800">
            {arabicSections.map((section) => (
              <li key={section.title} className="space-y-2">
                <span className="font-semibold text-gray-900">{section.title}</span>
                {section.content.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-relaxed text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
