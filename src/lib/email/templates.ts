function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html dir="rtl" lang="fa">
  <body style="font-family:Tahoma,Arial,sans-serif;background:#07070a;color:#f5f5f7;padding:24px;">
    <div style="max-width:520px;margin:0 auto;background:#0f0f13;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px;">
      <h2 style="color:#e11d2e;margin-top:0;">${title}</h2>
      ${bodyHtml}
      <p style="color:#9a9aa5;font-size:12px;margin-top:32px;">این ایمیل به صورت خودکار ارسال شده است.</p>
    </div>
  </body>
</html>`;
}

export const emailTemplates = {
  welcome: (name: string) => layout("خوش آمدید", `<p>سلام ${name}، به پلتفرم ما خوش آمدید.</p>`),
  otp: (code: string) =>
    layout("کد تایید", `<p>کد ورود شما: <b style="font-size:24px;letter-spacing:4px;">${code}</b></p>`),
  orderConfirmation: (orderNumber: string, total: string) =>
    layout(
      "تایید سفارش",
      `<p>سفارش شما به شماره <b>${orderNumber}</b> ثبت شد. مبلغ: ${total}</p>`,
    ),
  paymentConfirmation: (orderNumber: string) =>
    layout("تایید پرداخت", `<p>پرداخت سفارش <b>${orderNumber}</b> با موفقیت انجام شد.</p>`),
  downloadReady: (productTitle: string, url: string) =>
    layout(
      "فایل شما آماده دانلود است",
      `<p>محصول <b>${productTitle}</b> آماده دانلود است.</p><p><a href="${url}" style="color:#e11d2e;">دانلود فایل</a></p>`,
    ),
  courseEnrollment: (courseTitle: string) =>
    layout("ثبت‌نام در دوره", `<p>ثبت‌نام شما در دوره <b>${courseTitle}</b> با موفقیت انجام شد.</p>`),
  projectUpdate: (projectId: string, status: string) =>
    layout("به‌روزرسانی پروژه", `<p>وضعیت پروژه شما (#${projectId}) به «${status}» تغییر کرد.</p>`),
  passwordReset: (code: string) =>
    layout("بازیابی رمز عبور", `<p>کد بازیابی رمز عبور شما: <b style="font-size:24px;">${code}</b></p>`),
};
